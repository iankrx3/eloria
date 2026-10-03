import { createMockProviders, type Providers } from '@eloria/providers';
import type { SafetyVerdict, StoryStatus } from '@eloria/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PipelineRepo, StoryJobContext } from '../repos/pipeline-repo';
import { audioCacheKey, handlePipelineFailure, runStoryPipeline } from './story-pipeline';

const STORY = '33333333-3333-4333-8333-333333333333';
const USER = '11111111-1111-4111-8111-111111111111';

function createFakePipelineRepo(opts: { cachedAudio?: boolean } = {}) {
  const statuses: StoryStatus[] = [];
  const state = {
    status: 'queued' as StoryStatus,
    errorCode: null as string | null,
    script: null as string | null,
    calls: [] as string[],
    audioHashes: [] as string[],
    job: { step: 'queued', status: 'pending' as string, error: undefined as string | undefined },
  };
  const ctx: StoryJobContext = {
    storyId: STORY,
    userId: USER,
    dream: '바다가 보이는 작업실',
    displayName: '서아',
    profileTone: 'calm',
    preferredVoiceId: null,
    likes: ['바다 산책'],
    dislikes: [],
    people: [{ name: '민준', relation: 'partner' }],
    quiz: { day_start: 'seaside' },
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
    saveAudio: async (a) => void state.audioHashes.push(a.contentHash),
    resolveVoiceId: async () => null,
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
    const result = await runStoryPipeline({ repo: fake.repo, providers }, event, run as never);

    expect(result).toEqual({ outcome: 'ready' });
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
});

describe('audioCacheKey', () => {
  it('공백 차이는 같은 키, 보이스·모델이 다르면 다른 키', () => {
    expect(audioCacheKey('m', 'v', '안녕  하세요')).toBe(audioCacheKey('m', 'v', '안녕 하세요 '));
    expect(audioCacheKey('m', 'v', '안녕')).not.toBe(audioCacheKey('m', 'v2', '안녕'));
    expect(audioCacheKey('m', 'v', '안녕')).not.toBe(audioCacheKey('m2', 'v', '안녕'));
  });
});
