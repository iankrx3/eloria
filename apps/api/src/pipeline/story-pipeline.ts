import { createHash } from 'node:crypto';
import { ARIN_STORY_PROMPT_VERSION, buildArinUserInfo } from '@eloria/prompts';
import {
  isCrisis,
  LIMITS,
  scenePlanSchema,
  scriptFromArinStory,
  type ArinStory,
  type SafetyVerdict,
  type ScenePlan,
  type StoryGenerateRequested,
} from '@eloria/shared';
import { ProviderError, type Providers, type StoryContext, type Usage } from '@eloria/providers';
import type { StoryNotifier } from '../notifications/story-notifier';
import type { PipelineRepo, StoryJobContext } from '../repos/pipeline-repo';

/** Inngest의 step.run. 반환값은 JSON으로 직렬화되어 재시도 사이에 보존된다. */
export type StepRunner = <T>(id: string, fn: () => Promise<T>) => Promise<T>;

export type PipelineDeps = {
  repo: PipelineRepo;
  providers: Providers;
  /** 생성 완료 푸시. 없으면 보내지 않는다(테스트, 로컬). */
  notifier?: StoryNotifier;
};

export type PipelineResult =
  | { outcome: 'ready' }
  | { outcome: 'text_only'; errorCode: 'TTS_BUDGET' }
  | { outcome: 'blocked'; errorCode: 'SAFETY_BLOCKED' | 'SAFETY_CRISIS' };

/** 크레딧 상한·글자 수 초과는 다시 해도 같은 결과다. 재시도하지 않고 글만 둔다(D-49). */
const isTtsLimit = (error: unknown) =>
  error instanceof ProviderError && (error.code === 'BUDGET_EXCEEDED' || error.code === 'TOO_LONG');

/** 꿈 입력 차단 사유를 앱이 구분할 수 있게 한다. 위기 신호는 도움 안내 화면으로 간다(AI_PIPELINE 4.3). */
const blockCode = (v: SafetyVerdict) => (isCrisis(v) ? 'SAFETY_CRISIS' : 'SAFETY_BLOCKED');

/** 음성 캐시 키: sha256(model + voiceId + normalizedText + settings) (AI_PIPELINE 7절) */
export function audioCacheKey(model: string, voiceId: string, text: string, settings: object = {}) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return createHash('sha256')
    .update([model, voiceId, normalized, JSON.stringify(settings)].join('\u0000'))
    .digest('hex');
}

function toStoryContext(ctx: StoryJobContext, tone: StoryContext['tone']): StoryContext {
  return {
    dream: ctx.dream,
    displayName: ctx.displayName,
    tone,
    people: ctx.people,
    age: ctx.quiz.age,
    gender: ctx.quiz.gender,
    desireWhy: ctx.quiz.desire_why,
    loveDesired: ctx.quiz.love_desired ?? undefined,
    dreamHome: ctx.quiz.dream_home,
    dreamDays: ctx.quiz.dream_days,
    likes: ctx.likes,
    dislikes: ctx.dislikes,
  };
}

/** 입력 검수 대상: 꿈 + (있으면) 고른 장면. 장면 글도 사용자가 고칠 수 있는 데이터라 함께 본다. */
function inputText(ctx: StoryJobContext) {
  return ctx.vision ? `${ctx.dream}\n${ctx.vision.title}\n${ctx.vision.hint}` : ctx.dream;
}

/**
 * 스토리 생성: 입력 검수 → 장면 계획 → 작성 → 검수(rewrite면 1회 재작성) → 텍스트 공개 → 음성 → 완료
 * (docs/AI_PIPELINE.md 2~3절). 표지 이미지는 M3에서 붙이고, 그 전까지는 카테고리 기본 이미지를 쓴다.
 */
/** 파이프라인 입력. 사용자 스토리는 story/generate.requested, 리추얼은 library/story.requested에서 온다. */
export type PipelineInput = Pick<StoryGenerateRequested, 'storyId' | 'tone' | 'voiceKey'>;

export async function runStoryPipeline(
  deps: PipelineDeps,
  event: PipelineInput,
  step: StepRunner,
): Promise<PipelineResult> {
  const { repo, providers } = deps;
  const { storyId } = event;

  /** 외부 호출 1회를 실행하고 generation_jobs에 기록한다. */
  async function call<T extends { usage: Usage }>(
    ctx: StoryJobContext,
    name: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const startedAt = new Date().toISOString();
    const result = await fn();
    await repo.recordCall({
      userId: ctx.userId,
      storyId,
      step: name,
      usage: result.usage,
      startedAt,
      finishedAt: new Date().toISOString(),
    });
    return result;
  }

  const ctx = await step('load-context', async () => {
    const loaded = await repo.loadContext(storyId);
    await repo.updateStoryJob(storyId, 'load-context', 'running');
    return loaded;
  });
  const storyCtx = toStoryContext(ctx, event.tone ?? ctx.profileTone ?? 'calm');

  const inputVerdict = await step('review-input', async () => {
    await repo.setStatus(storyId, 'planning');
    return (
      await call(ctx, 'review-input', () => providers.story.reviewSafety(inputText(ctx), 'dream'))
    ).verdict;
  });
  if (inputVerdict.verdict === 'block') {
    const errorCode = blockCode(inputVerdict);
    await step('block-input', async () => {
      await repo.setStatus(storyId, 'failed', errorCode);
      await repo.updateStoryJob(storyId, 'review-input', 'failed', errorCode);
    });
    return { outcome: 'blocked', errorCode };
  }

  const review = (id: string, script: string) =>
    step(id, async () => {
      await repo.setStatus(storyId, 'reviewing');
      return (await call(ctx, id, () => providers.story.reviewSafety(script, 'script'))).verdict;
    });

  // 리추얼과 퀴즈 직후 첫 이야기는 장면 계획 → 본문을 유지한다.
  // 오늘의 이야기, 고른 장면, 수정은 JSON 한 편이다.
  const useArin =
    ctx.kind !== 'library' &&
    (ctx.kind === 'daily' || ctx.vision != null || Boolean(ctx.revisionRequest));

  let script: string;
  let title: string;
  let scenePlan: ScenePlan | null = null;
  let imageHint: ArinStory['image_hint'] | undefined;
  let affirmations: string[] | undefined;
  let arinStory: ArinStory | undefined;
  let promptVersion: string;

  if (!useArin) {
    const plan = await step('plan', async () => {
      const { plan } = await call(ctx, 'plan', () => providers.story.planScenes(storyCtx));
      return scenePlanSchema.parse(plan);
    });
    const write = (id: string, safetyFeedback?: SafetyVerdict) =>
      step(id, async () => {
        await repo.setStatus(storyId, 'writing');
        const { script: written } = await call(ctx, id, () =>
          providers.story.writeStory(plan, storyCtx, {
            targetChars:
              ctx.kind === 'daily' ? LIMITS.DAILY_TARGET_CHARS : LIMITS.STORY_TARGET_CHARS,
            maxChars: ctx.kind === 'daily' ? LIMITS.DAILY_MAX_CHARS : LIMITS.STORY_MAX_CHARS,
            safetyFeedback,
          }),
        );
        return written;
      });
    script = await write('write');
    let verdict = await review('review', script);
    if (verdict.verdict === 'rewrite') {
      script = await write('rewrite', verdict);
      verdict = await review('review-rewrite', script);
    }
    if (verdict.verdict !== 'pass') {
      const errorCode = blockCode(verdict);
      await step('block-script', async () => {
        await repo.setStatus(storyId, 'failed', errorCode);
        await repo.updateStoryJob(storyId, 'review', 'failed', errorCode);
      });
      return { outcome: 'blocked', errorCode };
    }
    title = plan.title;
    scenePlan = plan;
    promptVersion = providers.story.promptVersion;
  } else {
    const write = (id: string, safetyFeedback?: SafetyVerdict, previous?: ArinStory) =>
      step(id, async () => {
        await repo.setStatus(storyId, 'writing');
        const info = buildArinUserInfo({
          displayName: ctx.displayName,
          todayWish: ctx.kind === 'daily' ? (ctx.quiz.desire ?? ctx.dream) : ctx.dream,
          quiz: ctx.quiz,
          people: ctx.people,
          lifestyle: ctx.likes,
          exclude: ctx.dislikes,
          recentLines: ctx.recentLines,
        });
        const { story } = await call(ctx, id, () =>
          providers.story.writeArinStory({
            info,
            chosenScene: ctx.vision
              ? { title: ctx.vision.title, hint: ctx.vision.hint }
              : undefined,
            previousStory: previous ?? ctx.previousStory ?? undefined,
            revisionRequest: ctx.revisionRequest ?? undefined,
            safetyFeedback: safetyFeedback?.reasons,
          }),
        );
        // 고른 장면의 제목을 그대로 쓴다. 모델이 다른 제목을 내도 카드와 맞춘다.
        return ctx.vision ? { ...story, title: ctx.vision.title } : story;
      });
    let story = await write('write');
    script = scriptFromArinStory(story);
    let verdict = await review('review', script);
    if (verdict.verdict === 'rewrite') {
      story = await write('rewrite', verdict, story);
      script = scriptFromArinStory(story);
      verdict = await review('review-rewrite', script);
    }
    if (verdict.verdict !== 'pass') {
      const errorCode = blockCode(verdict);
      await step('block-script', async () => {
        await repo.setStatus(storyId, 'failed', errorCode);
        await repo.updateStoryJob(storyId, 'review', 'failed', errorCode);
      });
      return { outcome: 'blocked', errorCode };
    }
    title = story.title;
    imageHint = story.image_hint;
    affirmations = story.affirmations;
    arinStory = story;
    promptVersion = ARIN_STORY_PROMPT_VERSION;
  }

  // 여기부터 앱은 "먼저 읽어보기"를 연다(text_ready).
  await step('save-text', () =>
    repo.saveText(storyId, {
      scenePlan,
      script,
      promptVersion,
      title,
      imageHint,
      affirmations,
      arinStory,
    }),
  );

  const voiced = await step('tts', async () => {
    const voice = await repo.resolveVoice(event.voiceKey, ctx.preferredVoiceId);
    const voiceId = providers.tts.resolveVoiceId(voice?.providerVoiceId ?? null);
    const hash = audioCacheKey(providers.tts.model, voiceId, script);
    if (await repo.reuseAudio(storyId, ctx.userId, hash)) {
      await repo.setStatus(storyId, 'audio_ready');
      return true;
    }
    let audio;
    try {
      audio = await call(ctx, 'tts', () => providers.tts.synthesize({ text: script, voiceId }));
    } catch (error) {
      if (!isTtsLimit(error)) throw error;
      // 읽기는 계속 열어 둔다(text_ready + 오류 코드 = 음성 단계 끝, 앱은 "글로 읽기").
      await repo.setStatus(storyId, 'text_ready', 'TTS_BUDGET');
      await repo.updateStoryJob(storyId, 'tts', 'failed', (error as Error).message.slice(0, 500));
      return false;
    }
    await repo.saveAudio({
      userId: ctx.userId,
      storyId,
      bytes: audio.audio,
      mime: audio.mime,
      durationSec: audio.durationSec,
      contentHash: hash,
      provider: audio.usage.provider,
      model: audio.usage.model,
    });
    await repo.setStatus(storyId, 'audio_ready');
    return true;
  });
  if (!voiced) return { outcome: 'text_only', errorCode: 'TTS_BUDGET' };

  await step('finish', async () => {
    await repo.setStatus(storyId, 'ready');
    await repo.updateStoryJob(storyId, 'finish', 'succeeded');
  });

  // 스토리는 이미 ready다. 푸시가 실패해도 함수 전체를 실패로 돌리지 않는다(onFailure가 상태를 바꾸지 않게).
  const notifier = deps.notifier;
  const owner = ctx.userId;
  if (notifier && owner) {
    await step('notify', async () => {
      try {
        await notifier.storyReady(owner, storyId, title);
        return { sent: true };
      } catch (error) {
        console.warn('[notify] story_ready push failed', storyId, error);
        return { sent: false };
      }
    });
  }
  return { outcome: 'ready' };
}

/**
 * 재시도를 다 쓰고 실패했을 때. 텍스트까지 나왔으면 읽기는 계속 열어 두고(AI_PIPELINE 2절: tts 실패해도
 * 텍스트 유지) 오류 코드만 남긴다.
 */
/** 하루 호출 상한·공급자 한도로 멈춘 실패는 따로 표시한다(앱은 "잠시 후 다시" 안내, D-45). */
function failureCode(error: Error) {
  return /\[(BUDGET_EXCEEDED|RATE_LIMITED)\]/.test(error.message) ? 'AI_BUSY' : 'GENERATION_FAILED';
}

export async function handlePipelineFailure(repo: PipelineRepo, storyId: string, error: Error) {
  const status = await repo.getStatus(storyId);
  if (status === 'text_ready' || status === 'audio_ready') {
    await repo.setStatus(storyId, status, status === 'text_ready' ? 'TTS_FAILED' : 'FINISH_FAILED');
  } else if (status !== 'ready') {
    await repo.setStatus(storyId, 'failed', failureCode(error));
  }
  await repo.updateStoryJob(storyId, 'failed', 'failed', error.message.slice(0, 500));
}
