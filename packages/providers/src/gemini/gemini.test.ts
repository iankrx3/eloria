import type { StoryContext } from '@eloria/prompts';
import { sampleArinStory } from '@eloria/shared';
import { describe, expect, it } from 'vitest';
import { createProviders } from '../index';
import { resolveProviderModes } from '../mode';
import { createDailyBudget, createMemoryBudget } from './budget';
import {
  ARIN_STORY_TIMEOUT_MS,
  createGeminiStoryModel,
  createGeminiVisionModel,
  ProviderError,
  type GeminiGenerate,
  type GeminiRequest,
} from './gemini';

const MODELS = { story: 'gemini-3.6-flash', safety: 'gemini-3.1-flash-lite' };

const ctx: StoryContext = {
  displayName: '서아',
  dream: '바닷가 마을에서 작은 책방을 여는 삶',
  people: [],
  tone: 'calm',
};

/** 응답을 차례로 돌려주고 받은 요청을 모으는 가짜 Gemini */
function fakeGemini(texts: string[]) {
  const calls: GeminiRequest[] = [];
  const generate: GeminiGenerate = async (req) => {
    calls.push(req);
    const text = texts.shift();
    if (text === undefined) throw new Error('예상보다 많이 불렀습니다');
    return { text, promptTokens: 1000, outputTokens: 500 };
  };
  return { generate, calls };
}

describe('createGeminiStoryModel', () => {
  it('검수는 safety 모델로, JSON 스키마를 붙여 부르고 비용을 계산한다', async () => {
    const fake = fakeGemini([JSON.stringify({ verdict: 'pass', reasons: [] })]);
    const model = createGeminiStoryModel({ generate: fake.generate, models: MODELS });
    const { verdict, usage } = await model.reviewSafety('바닷가 책방', 'dream');
    expect(verdict).toEqual({ verdict: 'pass', reasons: [] });
    expect(fake.calls[0]?.model).toBe('gemini-3.1-flash-lite');
    expect(fake.calls[0]?.jsonSchema).toBeDefined();
    expect(fake.calls[0]?.thinking).toBe('minimal');
    // 1000 × 0.25 + 500 × 1.5 (100만 토큰당)
    expect(usage).toMatchObject({ provider: 'gemini', inputTokens: 1000, outputTokens: 500 });
    expect(usage.estCostUsd).toBe(0.001);
  });

  it('형식이 틀린 JSON은 한 번만 다시 부르고 토큰을 합쳐 기록한다', async () => {
    const fake = fakeGemini([
      '{"verdict":"maybe"}',
      JSON.stringify({ verdict: 'block', reasons: ['self_harm'] }),
    ]);
    const model = createGeminiStoryModel({ generate: fake.generate, models: MODELS });
    const { verdict, usage } = await model.reviewSafety('...', 'script');
    expect(verdict.verdict).toBe('block');
    expect(fake.calls).toHaveLength(2);
    expect(usage.inputTokens).toBe(2000);
  });

  it('두 번 다 틀리면 BAD_OUTPUT', async () => {
    const fake = fakeGemini(['not json', '{}']);
    const model = createGeminiStoryModel({ generate: fake.generate, models: MODELS });
    await expect(model.reviewSafety('...', 'dream')).rejects.toMatchObject({ code: 'BAD_OUTPUT' });
  });

  it('스토리는 story 모델의 텍스트를 다듬어 돌려준다', async () => {
    const fake = fakeGemini(['  서아 님, 천천히 눈을 떠 보세요.  ']);
    const model = createGeminiStoryModel({ generate: fake.generate, models: MODELS });
    const plan = {
      title: '바닷가 책방',
      goal: '책방을 여는 삶',
      setting: { place: '바닷가 책방', timeOfDay: 'morning' as const },
      beats: [],
      identityStatements: [],
      people: [],
      imagePrompt: 'sea',
      tone: 'calm' as const,
    };
    const { script } = await model.writeStory(plan, ctx, { targetChars: 3200, maxChars: 3800 });
    expect(script).toBe('서아 님, 천천히 눈을 떠 보세요.');
    expect(fake.calls[0]?.model).toBe('gemini-3.6-flash');
    expect(fake.calls[0]?.jsonSchema).toBeUndefined();
    expect(fake.calls[0]?.thinking).toBe('low');
  });

  it('이야기 JSON은 story 모델, 사고 수준 high, 120초로 받는다', async () => {
    const sample = sampleArinStory();
    const fake = fakeGemini([JSON.stringify(sample)]);
    const model = createGeminiStoryModel({ generate: fake.generate, models: MODELS });
    const { story } = await model.writeArinStory({
      info: {
        name: '서연',
        age: 27,
        gender: '여성',
        today_wish: '람보르기니',
        quiz: {
          wish: '',
          why: '',
          obstacle: '',
          love: '',
          love_included: false,
          desired_love: '',
          specific_person: '',
          people: [],
          mornings: [],
          dream_day: '',
        },
        lifestyle: [],
        exclude: [],
      },
    });
    expect(story.title).toBe(sample.title);
    expect(fake.calls[0]).toMatchObject({
      model: 'gemini-3.6-flash',
      thinking: 'high',
      timeoutMs: ARIN_STORY_TIMEOUT_MS,
      maxOutputTokens: 16_000,
    });
    expect(fake.calls[0]?.messages.user.startsWith('[사용자 정보]')).toBe(true);
  });

  it('장면 미리보기는 사용자 정보와 생각 수준 low로 받는다', async () => {
    const fake = fakeGemini([
      JSON.stringify({
        scenes: [
          { title: '창을\n연다', hint: '따뜻한 결' },
          { title: '앉아\n있는다', hint: '고요한 온기' },
          { title: '불을\n켠다', hint: '켜지는 벅참' },
          { title: '문을\n연다', hint: '익숙한 공기' },
        ],
      }),
    ]);
    const model = createGeminiVisionModel({ generate: fake.generate, model: 'gemini-3.6-flash' });
    const { set } = await model.suggest({
      name: '서연',
      age: 27,
      gender: '여성',
      today_wish: '에테르노 청담',
      quiz: {
        wish: '',
        why: '',
        obstacle: '',
        love: '',
        love_included: false,
        desired_love: '',
        specific_person: '',
        people: [],
        mornings: [],
        dream_day: '',
      },
      lifestyle: [],
      exclude: [],
    });
    expect(set.scenes).toHaveLength(4);
    expect(fake.calls[0]).toMatchObject({ model: 'gemini-3.6-flash', thinking: 'low' });
    expect(fake.calls[0]?.timeoutMs).toBeUndefined();
    expect(fake.calls[0]?.messages.system.startsWith('너는 ARIN(아린)의 이야기 작가다.')).toBe(true);
    expect(fake.calls[0]?.messages.user.startsWith('[사용자 정보]')).toBe(true);
  });

  it('상한에 닿으면 Gemini를 부르지 않는다', async () => {
    const fake = fakeGemini([JSON.stringify({ verdict: 'pass', reasons: [] })]);
    const model = createGeminiStoryModel({
      generate: fake.generate,
      models: MODELS,
      budget: createMemoryBudget(0),
    });
    await expect(model.reviewSafety('...', 'dream')).rejects.toBeInstanceOf(ProviderError);
    expect(fake.calls).toHaveLength(0);
  });
});

describe('createDailyBudget', () => {
  it('기록된 수와 이 프로세스가 가져간 수 중 큰 값으로 센다', async () => {
    let recorded = 0;
    const since: string[] = [];
    const budget = createDailyBudget({
      limit: 2,
      countUsed: async (iso) => {
        since.push(iso);
        return recorded;
      },
      now: () => new Date('2026-11-12T09:00:00Z'),
    });
    await budget.take();
    await budget.take(); // 아직 기록 0이지만 이 프로세스가 2번 가져갔다
    await expect(budget.take()).rejects.toMatchObject({ code: 'BUDGET_EXCEEDED' });
    recorded = 2;
    await expect(budget.take()).rejects.toMatchObject({ code: 'BUDGET_EXCEEDED' });
    expect(since[0]).toBe('2026-11-12T00:00:00.000Z');
  });

  it('날짜가 바뀌면 다시 센다', async () => {
    let now = new Date('2026-11-12T23:59:00Z');
    const budget = createDailyBudget({ limit: 1, countUsed: async () => 0, now: () => now });
    await budget.take();
    await expect(budget.take()).rejects.toBeInstanceOf(ProviderError);
    now = new Date('2026-11-13T00:01:00Z');
    await expect(budget.take()).resolves.toBeUndefined();
  });
});

describe('공급자 모드', () => {
  it('GEMINI_MODE·TTS_MODE가 없으면 PROVIDER_MODE를 따른다', () => {
    expect(resolveProviderModes({ PROVIDER_MODE: 'mock' })).toEqual({
      gemini: 'mock',
      tts: 'mock',
    });
    expect(resolveProviderModes({ PROVIDER_MODE: 'mock', GEMINI_MODE: 'live' })).toEqual({
      gemini: 'live',
      tts: 'mock',
    });
  });

  it('프로덕션에서는 mock을 쓸 수 없다', () => {
    expect(() => resolveProviderModes({ NODE_ENV: 'production', TTS_MODE: 'mock' })).toThrow();
  });

  it('live Gemini는 키와 상한이 없으면 만들지 않는다', () => {
    const env = { PROVIDER_MODE: 'mock', GEMINI_MODE: 'live' };
    expect(() => createProviders(env)).toThrow(/GEMINI_API_KEY/);
    expect(() => createProviders({ ...env, GEMINI_API_KEY: 'x' })).toThrow(/budget/);
    expect(
      createProviders({ ...env, GEMINI_API_KEY: 'x' }, { budget: createMemoryBudget(1) }).story
        .promptVersion,
    ).toContain('scene-plan@v2');
  });
});
