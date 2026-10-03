import { createMockProviders } from './mock/mock-providers';
import { resolveProviderMode } from './mode';
import type { Providers } from './types';

export * from './mode';
export * from './pricing';
export * from './types';
export { createMockProviders } from './mock/mock-providers';
export { silentMp3 } from './mock/silent-mp3';

/**
 * 환경에 맞는 어댑터를 고른다. live(Gemini·ElevenLabs) 어댑터는 유료 키를 받은 뒤 M2에서 추가한다.
 */
export function createProviders(env: Record<string, string | undefined>): Providers {
  const mode = resolveProviderMode(env);
  if (mode === 'mock') return createMockProviders({ delayMs: 800 });
  throw new Error('live 어댑터는 아직 없습니다. 개발 중에는 PROVIDER_MODE=mock을 쓰세요.');
}
