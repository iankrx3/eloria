/**
 * 원가 상한과 생성 한도 기본값(docs/AI_PIPELINE.md 6절).
 * 운영 중에는 app_config 테이블 값이 있으면 그 값을 우선한다.
 */
export const LIMITS = {
  STORY_TARGET_CHARS: 3200,
  STORY_MAX_CHARS: 3800,
  DAILY_TARGET_CHARS: 700,
  FREE_STORIES_TOTAL: 1,
  SUB_STORIES_PER_MONTH: 30,
  SUB_VERSIONS_PER_DESIRE: 3,
  DAILY_PREGEN_ACTIVE_DAYS: 3,
  MAX_CONCURRENT_TTS: 8,
  /** 사용자당 생성 요청 분당 한도(docs/ARCHITECTURE.md 6절) */
  GENERATION_REQUESTS_PER_MINUTE: 3,
} as const;

export type LimitKey = keyof typeof LIMITS;

/** app_config에서 읽은 값으로 기본값을 덮어쓴다. 0 이상의 유한한 숫자만 받는다. */
export function resolveLimits(
  overrides: Partial<Record<string, unknown>>,
): Record<LimitKey, number> {
  const resolved: Record<LimitKey, number> = { ...LIMITS };
  for (const key of Object.keys(LIMITS) as LimitKey[]) {
    const value = overrides[key];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      resolved[key] = value;
    }
  }
  return resolved;
}
