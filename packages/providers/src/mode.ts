/**
 * `PROVIDER_MODE=mock`이면 어댑터가 외부 API를 부르지 않고 고정 결과를 돌려준다.
 * 유료 키 없이 생성 파이프라인(상태 전이, Realtime, 플레이어)을 개발하기 위한 모드다.
 * 프로덕션에서는 mock을 허용하지 않는다.
 */
export type ProviderMode = 'live' | 'mock';

export function resolveProviderMode(env: Record<string, string | undefined>): ProviderMode {
  const mode = env.PROVIDER_MODE ?? 'live';
  if (mode !== 'live' && mode !== 'mock') {
    throw new Error(`PROVIDER_MODE는 live 또는 mock이어야 합니다: ${mode}`);
  }
  if (mode === 'mock' && env.NODE_ENV === 'production') {
    throw new Error('프로덕션에서는 PROVIDER_MODE=mock을 쓸 수 없습니다');
  }
  return mode;
}
