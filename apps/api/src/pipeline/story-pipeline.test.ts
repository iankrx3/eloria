import { createMockProviders, ProviderError, type Providers } from '@eloria/providers';
import { LIMITS, type SafetyVerdict, type StoryStatus, type Vision } from '@eloria/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PipelineRepo, StoryJobContext } from '../repos/pipeline-repo';
import { audioCacheKey, handlePipelineFailure, runStoryPipeline } from './story-pipeline';

const STORY = '33333333-3333-4333-8333-333333333333';
const USER = '11111111-1111-4111-8111-111111111111';

function createFakePipelineRepo(
  opts: {
    cachedAudio?: boolean;
    library?: boolean;
    daily?: boolean;
    vision?: Vision;
    voice?: { id: string; providerVoiceId: string };
  } = {},
) {
  const statuses: StoryStatus[] = [];
  const state = {
    status: 'queued' as StoryStatus,
    errorCode: null as string | null,
    script: null as string | null,
    calls: [] as string[],
    audioHashes: [] as string[],
    owners: [] as (string | null)[],
    job: { step: 'queued', status: 'pending' as string, error: undefined as string | undefined },
  };
  const ctx: StoryJobContext = {
    storyId: STORY,
    userId: opts.library ? null : USER,
    dream: '바다가 보이는 작업실',
    displayName: '서아',
    profileTone: 'calm',
    preferredVoiceId: null,
    likes: ['바다 산책'],
    dislikes: [],
    people: [{ name: '민준', relation: 'partner' }],
    quiz: { dream_home: ['jeju_sea'] },
    kind: opts.library ? 'library' : opts.daily ? 'daily' : 'on_demand',
    vision: opts.vision ?? null,
  };

  const repo: PipelineRepo = {
    loadContext: async () => ctx,
    setStatus: async (_id, status, errorCode) => {
      state.status = status;
      statuses.push(status);
      if (errorCode !== undefined) state.errorCode = errorCode;
    },
    getStatus: async () => state.status,
    saveText: async (_id, { script }) => {
      state.script = script;
      state.status = 'text_ready';
      statuses.push('text_ready');
    },
    recordCall: async (c) => void state.calls.push(c.step),
    updateStoryJob: async (_id, step, status, error) =>
      void Object.assign(state.job, { step, status, error }),
    reuseAudio: async () => Boolean(opts.cachedAudio),
    saveAudio: async (a) => {
      state.audioHashes.push(a.contentHash);
      state.owners.push(a.userId);
    },
    resolveVoice: async () => opts.voice ?? null,
  };
  return { repo, state, statuses };
}

/** 검수 결과를 순서대로 돌려주는 어댑터(입력 검수, 스크립트 검수, ...) */
function providersWithVerdicts(...verdicts: SafetyVerdict[]): Providers {
  const base = createMockProviders();
  const review = vi.fn(async () => ({
    verdict: verdicts.shift() ?? { verdict: 'pass' as const, reasons: [] },
    usage: { provider: 'mock' as const, model: 'mock', estCostUsd: 0 },
  }));
  return { ...base, story: { ...base.story, reviewSafety: review } };
}

const run = (id: string, fn: () => Promise<unknown>) => fn();
const event = { storyId: STORY, userId: USER };

describe('runStoryPipeline', () => {
  let fake: ReturnType<typeof createFakePipelineRepo>;
  beforeEach(() => {
    fake = createFakePipelineRepo();
  });

  it('상태를 문서 순서대로 바꾸고 모든 외부 호출을 기록한다', async () => {
    const result = await runStoryPipeline(
      { repo: fake.repo, providers: createMockProviders() },
      event,
      run as never,
    );

    expect(result).toEqual({ outcome: 'ready' });
    expect(fake.statuses).toEqual([
      'planning',
      'writing',
      'reviewing',
      'text_ready',
      'audio_ready',
      'ready',
    ]);
    expect(fake.state.calls).toEqual(['review-input', 'plan', 'write', 'review', 'tts']);
    expect(fake.state.script).toContain('서아');
    expect(fake.state.script).toContain('바다 산책'); // Personal 좋아하는 것이 반영됨
    expect(fake.state.audioHashes).toEqual([
      audioCacheKey('mock-chime', 'default', fake.state.script!),
    ]);
    expect(fake.state.job).toMatchObject({ step: 'finish', status: 'succeeded' });
  });

  it('꿈 입력에 위기 신호가 있으면 만들지 않고 SAFETY_CRISIS로 끝낸다', async () => {
    const providers = providersWithVerdicts({ verdict: 'block', reasons: ['self_harm'] });
    const result = await runStoryPipeline({ repo: fake.repo, providers }, event, run as never);

    expect(result).toEqual({ outcome: 'blocked', errorCode: 'SAFETY_CRISIS' });
    expect(fake.state).toMatchObject({
      status: 'failed',
      errorCode: 'SAFETY_CRISIS',
      script: null,
    });
    expect(fake.state.calls).toEqual(['review-input']);
  });

  it('검수가 rewrite면 한 번 다시 쓰고, 통과하면 계속한다', async () => {
    const providers = providersWithVerdicts(
      { verdict: 'pass', reasons: [] },
      { verdict: 'rewrite', reasons: ['guaranteed_outcome'] },
      { verdict: 'pass', reasons: [] },
    );
    const writeStory = vi.spyOn(providers.story, 'writeStory');
    const result = await runStoryPipeline({ repo: fake.repo, providers }, event, run as never);

    expect(result).toEqual({ outcome: 'ready' });
    // 꿈 입력과 스크립트는 다른 기준으로 검수하고, 다시 쓸 때는 검수 이유를 넘긴다(D-36).
    expect(vi.mocked(providers.story.reviewSafety).mock.calls.map((c) => c[1])).toEqual([
      'dream',
      'script',
      'script',
    ]);
    expect(writeStory.mock.calls[0]?.[2].safetyFeedback).toBeUndefined();
    expect(writeStory.mock.calls[1]?.[2].safetyFeedback).toEqual({
      verdict: 'rewrite',
      reasons: ['guaranteed_outcome'],
    });
    expect(fake.state.calls).toEqual([
      'review-input',
      'plan',
      'write',
      'review',
      'rewrite',
      'review-rewrite',
      'tts',
    ]);
  });

  it('다시 써도 통과하지 못하면 SAFETY_BLOCKED, 텍스트는 공개하지 않는다', async () => {
    const providers = providersWithVerdicts(
      { verdict: 'pass', reasons: [] },
      { verdict: 'rewrite', reasons: ['financial_advice'] },
      { verdict: 'block', reasons: ['financial_advice'] },
    );
    const result = await runStoryPipeline({ repo: fake.repo, providers }, event, run as never);

    expect(result).toEqual({ outcome: 'blocked', errorCode: 'SAFETY_BLOCKED' });
    expect(fake.state.script).toBeNull();
    expect(fake.statuses).not.toContain('text_ready');
  });

  it('같은 음성이 캐시에 있으면 TTS를 다시 부르지 않는다', async () => {
    const cached = createFakePipelineRepo({ cachedAudio: true });
    await runStoryPipeline(
      { repo: cached.repo, providers: createMockProviders() },
      event,
      run as never,
    );

    expect(cached.state.calls).not.toContain('tts');
    expect(cached.state.audioHashes).toEqual([]);
    expect(cached.state.status).toBe('ready');
  });

  it('완료되면 장면 제목으로 푸시를 보내고, 푸시가 실패해도 ready로 끝난다', async () => {
    const storyReady = vi.fn(async () => {});
    await runStoryPipeline(
      { repo: fake.repo, providers: createMockProviders(), notifier: { storyReady } },
      event,
      run as never,
    );
    expect(storyReady).toHaveBeenCalledWith(USER, STORY, expect.any(String));

    const failing = createFakePipelineRepo();
    const broken = vi.fn(async () => {
      throw new Error('expo push 500');
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await runStoryPipeline(
      { repo: failing.repo, providers: createMockProviders(), notifier: { storyReady: broken } },
      event,
      run as never,
    );
    expect(result).toEqual({ outcome: 'ready' });
    expect(failing.state.status).toBe('ready');
  });

  it('공용 리추얼 스토리(소유자 없음)도 같은 단계로 만들고 푸시는 보내지 않는다', async () => {
    const library = createFakePipelineRepo({ library: true });
    const storyReady = vi.fn(async () => {});
    const result = await runStoryPipeline(
      { repo: library.repo, providers: createMockProviders(), notifier: { storyReady } },
      { storyId: STORY },
      run as never,
    );

    expect(result).toEqual({ outcome: 'ready' });
    expect(library.state.owners).toEqual([null]);
    expect(storyReady).not.toHaveBeenCalled();
  });

  it('고른 보이스의 공급자 ID로 음성을 만들고 캐시 키에도 쓴다', async () => {
    const voiced = createFakePipelineRepo({
      voice: { id: '44444444-4444-4444-8444-444444444444', providerVoiceId: 'el-voice-1' },
    });
    const providers = createMockProviders();
    const synthesize = vi.spyOn(providers.tts, 'synthesize');
    await runStoryPipeline({ repo: voiced.repo, providers }, event, run as never);

    expect(synthesize.mock.calls[0]?.[0].voiceId).toBe('el-voice-1');
    expect(voiced.state.audioHashes).toEqual([
      audioCacheKey('mock-chime', 'el-voice-1', voiced.state.script!),
    ]);
  });

  it('음성 크레딧 상한에 걸리면 재시도 없이 글만 두고(TTS_BUDGET) 푸시하지 않는다', async () => {
    const providers = createMockProviders();
    vi.spyOn(providers.tts, 'synthesize').mockRejectedValue(
      new ProviderError('BUDGET_EXCEEDED', '음성 1회 크레딧 상한(1000)을 넘습니다'),
    );
    const storyReady = vi.fn(async () => {});
    const result = await runStoryPipeline(
      { repo: fake.repo, providers, notifier: { storyReady } },
      event,
      run as never,
    );

    expect(result).toEqual({ outcome: 'text_only', errorCode: 'TTS_BUDGET' });
    expect(fake.state).toMatchObject({ status: 'text_ready', errorCode: 'TTS_BUDGET' });
    expect(fake.state.job).toMatchObject({ step: 'tts', status: 'failed' });
    expect(fake.statuses).not.toContain('ready');
    expect(storyReady).not.toHaveBeenCalled();
  });

  it('그 밖의 음성 오류는 던져서 Inngest가 재시도하게 한다', async () => {
    const providers = createMockProviders();
    vi.spyOn(providers.tts, 'synthesize').mockRejectedValue(new ProviderError('UPSTREAM', '503'));
    await expect(
      runStoryPipeline({ repo: fake.repo, providers }, event, run as never),
    ).rejects.toMatchObject({ code: 'UPSTREAM' });
  });

  it('차단된 스토리는 푸시하지 않는다', async () => {
    const storyReady = vi.fn(async () => {});
    const providers = providersWithVerdicts({ verdict: 'block', reasons: ['self_harm'] });
    await runStoryPipeline(
      { repo: fake.repo, providers, notifier: { storyReady } },
      event,
      run as never,
    );
    expect(storyReady).not.toHaveBeenCalled();
  });
});

describe('handlePipelineFailure', () => {
  it('텍스트가 나온 뒤 실패하면 읽기는 유지하고 TTS_FAILED만 남긴다', async () => {
    const fake = createFakePipelineRepo();
    fake.state.status = 'text_ready';
    await handlePipelineFailure(fake.repo, STORY, new Error('tts down'));
    expect(fake.state).toMatchObject({ status: 'text_ready', errorCode: 'TTS_FAILED' });
    expect(fake.state.job).toMatchObject({ status: 'failed', error: 'tts down' });
  });

  it('텍스트 전에 실패하면 GENERATION_FAILED', async () => {
    const fake = createFakePipelineRepo();
    fake.state.status = 'writing';
    await handlePipelineFailure(fake.repo, STORY, new Error('boom'));
    expect(fake.state).toMatchObject({ status: 'failed', errorCode: 'GENERATION_FAILED' });
  });

  it('하루 호출 상한·공급자 한도로 멈추면 AI_BUSY', async () => {
    const fake = createFakePipelineRepo();
    fake.state.status = 'planning';
    await handlePipelineFailure(fake.repo, STORY, new ProviderError('BUDGET_EXCEEDED', 'limit'));
    expect(fake.state).toMatchObject({ status: 'failed', errorCode: 'AI_BUSY' });
    // Inngest가 직렬화해 넘긴 일반 Error도 메시지로 알아본다.
    fake.state.status = 'planning';
    await handlePipelineFailure(fake.repo, STORY, new Error('[RATE_LIMITED] gemini 429'));
    expect(fake.state.errorCode).toBe('AI_BUSY');
    // 대문자가 섞인 다른 오류를 AI_BUSY로 오인하지 않는다.
    fake.state.status = 'planning';
    await handlePipelineFailure(fake.repo, STORY, new Error('[UPSTREAM] TIMEOUT'));
    expect(fake.state.errorCode).toBe('GENERATION_FAILED');
  });
});

describe('audioCacheKey', () => {
  it('공백 차이는 같은 키, 보이스·모델이 다르면 다른 키', () => {
    expect(audioCacheKey('m', 'v', '안녕  하세요')).toBe(audioCacheKey('m', 'v', '안녕 하세요 '));
    expect(audioCacheKey('m', 'v', '안녕')).not.toBe(audioCacheKey('m', 'v2', '안녕'));
    expect(audioCacheKey('m', 'v', '안녕')).not.toBe(audioCacheKey('m2', 'v', '안녕'));
  });
});

describe('비전·데일리(D-48)', () => {
  const vision: Vision = {
    position: 2,
    title: '노을 진 작업실의 저녁',
    summary: '창밖 바다를 보며 하루를 정리한다',
    place: '바닷가 작업실',
    timeOfDay: 'evening',
    storyId: null,
  };

  it('고른 장면을 입력 검수와 장면 계획에 넘긴다', async () => {
    const fake = createFakePipelineRepo({ vision });
    const providers = createMockProviders();
    const review = vi.spyOn(providers.story, 'reviewSafety');
    const plan = vi.spyOn(providers.story, 'planScenes');
    await runStoryPipeline({ repo: fake.repo, providers }, { storyId: STORY }, (_id, fn) => fn());
    expect(review.mock.calls[0]?.[0]).toContain('노을 진 작업실의 저녁');
    expect(plan.mock.calls[0]?.[0].vision).toMatchObject({
      place: '바닷가 작업실',
      timeOfDay: 'evening',
    });
  });

  it('데일리는 짧은 목표 길이로 쓴다', async () => {
    const fake = createFakePipelineRepo({ daily: true });
    const providers = createMockProviders();
    const write = vi.spyOn(providers.story, 'writeStory');
    await runStoryPipeline({ repo: fake.repo, providers }, { storyId: STORY }, (_id, fn) => fn());
    expect(write.mock.calls[0]?.[2]).toMatchObject({
      targetChars: LIMITS.DAILY_TARGET_CHARS,
      maxChars: LIMITS.DAILY_MAX_CHARS,
    });
  });
});
