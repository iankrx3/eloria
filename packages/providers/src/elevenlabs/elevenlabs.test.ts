import { describe, expect, it } from 'vitest';
import { createProviders } from '../index';
import {
  createMemoryTtsBudget,
  createMonthlyTtsBudget,
  ttsCredits,
  type TtsCreditBudget,
} from './credits';
import { createElevenLabsAccount, createElevenLabsTts, isPlaceholderVoice } from './elevenlabs';

type Call = { url: string; init: RequestInit };

/** 응답을 차례로 돌려주고 받은 요청을 모으는 가짜 fetch */
function fakeFetch(responses: (() => Response)[]) {
  const calls: Call[] = [];
  const fn = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = responses.shift();
    if (!next) throw new Error('예상보다 많이 불렀습니다');
    return next();
  }) as typeof fetch;
  return { fn, calls };
}

const mp3 = (bytes: number) => () =>
  new Response(new Uint8Array(bytes), { status: 200, headers: { 'content-type': 'audio/mpeg' } });
const json = (status: number, body: unknown) => () =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const unlimited: TtsCreditBudget = { take: async () => undefined };

function tts(
  fetchFn: typeof fetch,
  extra: Partial<Parameters<typeof createElevenLabsTts>[0]> = {},
) {
  return createElevenLabsTts({
    apiKey: 'test-key',
    model: 'eleven_v3',
    defaultVoiceId: 'voice-default',
    budget: unlimited,
    fetch: fetchFn,
    sleep: async () => undefined,
    ...extra,
  });
}

describe('createElevenLabsTts', () => {
  it('MP3 128kbps로 요청하고 길이·사용량·비용을 계산한다', async () => {
    const fake = fakeFetch([mp3(16_000)]);
    const result = await tts(fake.fn).synthesize({ text: '서아 님, 숨을 쉬어요.', voiceId: 'v1' });

    expect(fake.calls[0]?.url).toBe(
      'https://api.elevenlabs.io/v1/text-to-speech/v1?output_format=mp3_44100_128',
    );
    const headers = fake.calls[0]?.init.headers as Record<string, string>;
    expect(headers['xi-api-key']).toBe('test-key');
    expect(JSON.parse(String(fake.calls[0]?.init.body))).toEqual({
      text: '서아 님, 숨을 쉬어요.',
      model_id: 'eleven_v3',
      language_code: 'ko',
    });
    expect(result.mime).toBe('audio/mpeg');
    expect(result.durationSec).toBe(1);
    expect(result.usage).toMatchObject({
      provider: 'elevenlabs',
      model: 'eleven_v3',
      ttsChars: 13,
    });
  });

  it('Multilingual v2에는 language_code를 보내지 않는다', async () => {
    const fake = fakeFetch([mp3(10)]);
    await tts(fake.fn, { model: 'eleven_multilingual_v2' }).synthesize({
      text: '가',
      voiceId: 'v',
    });
    expect(JSON.parse(String(fake.calls[0]?.init.body))).not.toHaveProperty('language_code');
  });

  it('자리 보이스(mock-*)와 null은 기본 보이스로 바꾼다', () => {
    const provider = tts(fakeFetch([]).fn);
    expect(provider.resolveVoiceId('mock-harin')).toBe('voice-default');
    expect(provider.resolveVoiceId(null)).toBe('voice-default');
    expect(provider.resolveVoiceId('EXAVITQu4vr4xnSDxMaL')).toBe('EXAVITQu4vr4xnSDxMaL');
    expect(isPlaceholderVoice('default')).toBe(true);
  });

  it('크레딧 상한을 넘으면 API를 부르지 않는다', async () => {
    const fake = fakeFetch([]);
    const provider = tts(fake.fn, {
      budget: createMemoryTtsBudget({ perCall: 1000, total: 10_000 }),
    });
    await expect(
      provider.synthesize({ text: '가'.repeat(1001), voiceId: 'v' }),
    ).rejects.toMatchObject({ code: 'BUDGET_EXCEEDED' });
    expect(fake.calls).toHaveLength(0);
  });

  it('Flash v2.5는 글자당 0.5크레딧이라 같은 상한에서 2배까지 된다', async () => {
    const fake = fakeFetch([mp3(10)]);
    const provider = tts(fake.fn, {
      model: 'eleven_flash_v2_5',
      budget: createMemoryTtsBudget({ perCall: 1000, total: 10_000 }),
    });
    await provider.synthesize({ text: '가'.repeat(2000), voiceId: 'v' });
    expect(fake.calls).toHaveLength(1);
  });

  it('모델의 요청당 글자 수를 넘으면 TOO_LONG', async () => {
    const fake = fakeFetch([]);
    await expect(
      tts(fake.fn).synthesize({ text: '가'.repeat(5001), voiceId: 'v' }),
    ).rejects.toMatchObject({ code: 'TOO_LONG' });
    expect(fake.calls).toHaveLength(0);
  });

  it('429·5xx는 재시도하고, 다 쓰면 RATE_LIMITED', async () => {
    const ok = fakeFetch([json(503, {}), json(429, {}), mp3(10)]);
    await tts(ok.fn).synthesize({ text: '가', voiceId: 'v' });
    expect(ok.calls).toHaveLength(3);

    const busy = fakeFetch([json(429, {}), json(429, {}), json(429, { detail: 'busy' })]);
    await expect(tts(busy.fn).synthesize({ text: '가', voiceId: 'v' })).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
  });

  it('quota_exceeded는 재시도하지 않고 BUDGET_EXCEEDED, 메시지에 키를 넣지 않는다', async () => {
    const fake = fakeFetch([
      json(401, { detail: { status: 'quota_exceeded', message: 'You exceeded your quota' } }),
    ]);
    const error = await tts(fake.fn)
      .synthesize({ text: '가', voiceId: 'v' })
      .catch((e: Error) => e);
    expect(error).toMatchObject({ code: 'BUDGET_EXCEEDED' });
    expect((error as Error).message).toContain('quota_exceeded');
    expect((error as Error).message).not.toContain('test-key');
    expect(fake.calls).toHaveLength(1);
  });

  it('단가표에 없는 모델이면 만들 때 바로 실패한다', () => {
    expect(() => tts(fakeFetch([]).fn, { model: 'eleven_unknown' })).toThrow();
  });
});

describe('크레딧 상한', () => {
  it('글자당 크레딧은 모델별 배수, 모르는 모델은 1', () => {
    expect(ttsCredits('eleven_v3', 700)).toBe(700);
    expect(ttsCredits('eleven_flash_v2_5', 701)).toBe(351);
    expect(ttsCredits('eleven_new', 10)).toBe(10);
  });

  it('월 상한은 기록과 이 프로세스가 잡은 양 중 큰 값으로 센다', async () => {
    let recorded = 9_000;
    const budget = createMonthlyTtsBudget({
      perCall: 1000,
      perMonth: 10_000,
      countUsed: async (since) => {
        expect(since).toBe('2026-11-01T00:00:00.000Z');
        return recorded;
      },
      now: () => new Date('2026-11-14T03:00:00Z'),
    });
    await budget.take(600);
    recorded = 9_000; // 기록이 아직 안 쌓였어도
    await expect(budget.take(600)).rejects.toMatchObject({ code: 'BUDGET_EXCEEDED' });
    await budget.take(400);
  });

  it('달이 바뀌면 다시 센다', async () => {
    let now = new Date('2026-11-30T23:00:00Z');
    const budget = createMonthlyTtsBudget({
      perCall: 1000,
      perMonth: 1000,
      countUsed: async () => 0,
      now: () => now,
    });
    await budget.take(1000);
    await expect(budget.take(1)).rejects.toMatchObject({ code: 'BUDGET_EXCEEDED' });
    now = new Date('2026-12-01T00:00:00Z');
    await budget.take(1000);
  });
});

describe('createProviders(TTS)', () => {
  const base = { PROVIDER_MODE: 'mock', TTS_MODE: 'live', ELEVENLABS_API_KEY: 'k' };
  it('live 음성에는 기본 보이스와 크레딧 상한이 필요하다', () => {
    expect(() => createProviders(base, { ttsBudget: unlimited })).toThrow(/DEFAULT_VOICE_ID/);
    expect(() => createProviders({ ...base, ELEVENLABS_DEFAULT_VOICE_ID: 'v' })).toThrow(
      /ttsBudget/,
    );
    const providers = createProviders(
      { ...base, ELEVENLABS_DEFAULT_VOICE_ID: 'v' },
      { ttsBudget: unlimited },
    );
    expect(providers.tts.model).toBe('eleven_v3');
  });
});

describe('createElevenLabsAccount', () => {
  it('사용량과 보이스 목록을 읽는다', async () => {
    const fake = fakeFetch([
      json(200, { tier: 'free', character_count: 120, character_limit: 10000, other: 1 }),
      json(200, { voices: [{ voice_id: 'a', name: 'A', category: 'premade', labels: {} }] }),
    ]);
    const account = createElevenLabsAccount({ apiKey: 'k', fetch: fake.fn });
    expect(await account.subscription()).toMatchObject({ tier: 'free', character_count: 120 });
    expect(await account.voices()).toEqual([
      { voice_id: 'a', name: 'A', category: 'premade', labels: {} },
    ]);
    expect(fake.calls[0]?.url).toBe('https://api.elevenlabs.io/v1/user/subscription');
  });
});
