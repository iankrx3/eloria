import { createHash } from 'node:crypto';
import {
  isCrisis,
  LIMITS,
  scenePlanSchema,
  type SafetyVerdict,
  type StoryGenerateRequested,
} from '@eloria/shared';
import type { Providers, StoryContext, Usage } from '@eloria/providers';
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
  { outcome: 'ready' } | { outcome: 'blocked'; errorCode: 'SAFETY_BLOCKED' | 'SAFETY_CRISIS' };

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
    dayStart: ctx.quiz.day_start,
    futureSelf: ctx.quiz.future_self,
    recentFeeling: ctx.quiz.recent_feeling,
    oneYearChange: ctx.quiz.one_year_change,
    likes: ctx.likes,
    dislikes: ctx.dislikes,
  };
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
    return (await call(ctx, 'review-input', () => providers.story.reviewSafety(ctx.dream))).verdict;
  });
  if (inputVerdict.verdict === 'block') {
    const errorCode = blockCode(inputVerdict);
    await step('block-input', async () => {
      await repo.setStatus(storyId, 'failed', errorCode);
      await repo.updateStoryJob(storyId, 'review-input', 'failed', errorCode);
    });
    return { outcome: 'blocked', errorCode };
  }

  const plan = await step('plan', async () => {
    const { plan } = await call(ctx, 'plan', () => providers.story.planScenes(storyCtx));
    return scenePlanSchema.parse(plan);
  });

  const write = (id: string) =>
    step(id, async () => {
      await repo.setStatus(storyId, 'writing');
      const { script } = await call(ctx, id, () =>
        providers.story.writeStory(plan, storyCtx, {
          targetChars: LIMITS.STORY_TARGET_CHARS,
          maxChars: LIMITS.STORY_MAX_CHARS,
        }),
      );
      return script;
    });
  const review = (id: string, script: string) =>
    step(id, async () => {
      await repo.setStatus(storyId, 'reviewing');
      return (await call(ctx, id, () => providers.story.reviewSafety(script))).verdict;
    });

  let script = await write('write');
  let verdict = await review('review', script);
  if (verdict.verdict === 'rewrite') {
    script = await write('rewrite');
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

  // 여기부터 앱은 "먼저 읽어보기"를 연다(text_ready).
  await step('save-text', () =>
    repo.saveText(storyId, {
      scenePlan: plan,
      script,
      promptVersion: providers.story.promptVersion,
    }),
  );

  await step('tts', async () => {
    const voiceId = (await repo.resolveVoiceId(event.voiceKey, ctx.preferredVoiceId)) ?? 'default';
    const hash = audioCacheKey(providers.tts.model, voiceId, script);
    if (await repo.reuseAudio(storyId, ctx.userId, hash)) {
      await repo.setStatus(storyId, 'audio_ready');
      return;
    }
    const audio = await call(ctx, 'tts', () => providers.tts.synthesize({ text: script, voiceId }));
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
  });

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
        await notifier.storyReady(owner, storyId, plan.title);
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
export async function handlePipelineFailure(repo: PipelineRepo, storyId: string, error: Error) {
  const status = await repo.getStatus(storyId);
  if (status === 'text_ready' || status === 'audio_ready') {
    await repo.setStatus(storyId, status, status === 'text_ready' ? 'TTS_FAILED' : 'FINISH_FAILED');
  } else if (status !== 'ready') {
    await repo.setStatus(storyId, 'failed', 'GENERATION_FAILED');
  }
  await repo.updateStoryJob(storyId, 'failed', 'failed', error.message.slice(0, 500));
}
