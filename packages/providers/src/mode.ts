/**
 * `PROVIDER_MODE=mock`이면 어댑터가 외부 API를 부르지 않고 고정 결과를 돌려준다.
 * 유료 키 없이 생성 파이프라인(상태 전이, Realtime, 플레이어)을 개발하기 위한 모드다.
 * 글(Gemini)과 음성(ElevenLabs)은 `GEMINI_MODE`·`TTS_MODE`로 따로 바꿀 수 있고, 없으면 PROVIDER_MODE를 따른다(D-45).
 * 프로덕션에서는 mock을 허용하지 않는다.
 */
export type ProviderMode = 'live' | 'mock';

function parseMode(name: string, value: string, env: Record<string, string | undefined>) {
  if (value !== 'live' && value !== 'mock') {
    throw new Error(`${name}는 live 또는 mock이어야 합니다: ${value}`);
  }
  if (value === 'mock' && env.NODE_ENV === 'production') {
    throw new Error(`프로덕션에서는 ${name}=mock을 쓸 수 없습니다`);
  }
  return value;
}

export function resolveProviderMode(env: Record<string, string | undefined>): ProviderMode {
  return parseMode('PROVIDER_MODE', env.PROVIDER_MODE || 'live', env);
}

export function resolveProviderModes(env: Record<string, string | undefined>): {
  gemini: ProviderMode;
  tts: ProviderMode;
} {
  const base = resolveProviderMode(env);
  return {
    gemini: env.GEMINI_MODE ? parseMode('GEMINI_MODE', env.GEMINI_MODE, env) : base,
    tts: env.TTS_MODE ? parseMode('TTS_MODE', env.TTS_MODE, env) : base,
  };
}
