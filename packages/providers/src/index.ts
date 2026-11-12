import {
  createGenAiGenerate,
  createGeminiAffirmationModel,
  createGeminiStoryModel,
  type CallBudget,
} from './gemini/gemini';
import { createMockProviders } from './mock/mock-providers';
import { resolveProviderModes } from './mode';
import type { Providers } from './types';

export * from './gemini/budget';
export * from './gemini/gemini';
export * from './mode';
export * from './pricing';
export * from './push/expo-push';
export * from './types';
export { createMockProviders } from './mock/mock-providers';
export { chimeWav } from './mock/chime-wav';
export { silentMp3 } from './mock/silent-mp3';

/** 모델 기본값(docs/AI_PIPELINE.md 1절, 2026-11-12 공식 문서 확인). 환경 변수로 바꾼다. */
export const GEMINI_DEFAULT_MODELS = {
  story: 'gemini-3.6-flash',
  safety: 'gemini-3.1-flash-lite',
} as const;

/**
 * 환경에 맞는 어댑터를 고른다. 글은 Gemini(live) 또는 mock, 음성은 ElevenLabs 연결 전이라 mock만 있다.
 * live Gemini는 `budget`(하루 호출 상한)을 꼭 받는다. 무료 쿼터를 다 쓰지 않게 하기 위해서다(D-45).
 */
export function createProviders(
  env: Record<string, string | undefined>,
  opts: { budget?: CallBudget } = {},
): Providers {
  const modes = resolveProviderModes(env);
  const mock = createMockProviders({ delayMs: 800 });

  let story = mock.story;
  let affirmation = mock.affirmation;
  if (modes.gemini === 'live') {
    if (!env.GEMINI_API_KEY) throw new Error('GEMINI_MODE=live에는 GEMINI_API_KEY가 필요합니다');
    if (!opts.budget) throw new Error('live Gemini에는 하루 호출 상한(budget)이 필요합니다');
    const generate = createGenAiGenerate({ apiKey: env.GEMINI_API_KEY });
    const storyModel = env.GEMINI_STORY_MODEL || GEMINI_DEFAULT_MODELS.story;
    story = createGeminiStoryModel({
      generate,
      models: {
        story: storyModel,
        safety: env.GEMINI_SAFETY_MODEL || GEMINI_DEFAULT_MODELS.safety,
      },
      budget: opts.budget,
    });
    affirmation = createGeminiAffirmationModel({
      generate,
      model: storyModel,
      budget: opts.budget,
    });
  }

  if (modes.tts === 'live') {
    throw new Error('ElevenLabs 어댑터는 아직 없습니다. TTS_MODE=mock을 쓰세요.');
  }
  return { story, affirmation, tts: mock.tts };
}
