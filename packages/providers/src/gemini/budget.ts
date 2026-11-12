import { ProviderError, type CallBudget } from './gemini';

/** 기본 하루 호출 상한(서버 전체). 무료 쿼터를 지키려고 낮게 둔다(D-45). */
export const DEFAULT_GEMINI_DAILY_CALL_LIMIT = 50;

/**
 * 하루 상한(UTC 날짜 기준). `countUsed`는 오늘 이미 기록된 호출 수(generation_jobs의 gemini 행)다.
 * 기록은 호출이 끝난 뒤에 쌓이므로 이 프로세스가 오늘 가져간 수와 비교해 큰 값으로 센다.
 */
export function createDailyBudget(opts: {
  limit: number;
  countUsed: (sinceIso: string) => Promise<number>;
  now?: () => Date;
}): CallBudget {
  const now = opts.now ?? (() => new Date());
  let day = '';
  let taken = 0;
  return {
    async take() {
      const today = now().toISOString().slice(0, 10);
      if (today !== day) {
        day = today;
        taken = 0;
      }
      const used = Math.max(await opts.countUsed(`${today}T00:00:00.000Z`), taken);
      if (used >= opts.limit) {
        throw new ProviderError(
          'BUDGET_EXCEEDED',
          `오늘 Gemini 호출 상한(${opts.limit})에 닿았습니다`,
        );
      }
      taken = used + 1;
    },
  };
}

/** 기록 없이 프로세스 안에서만 세는 상한(평가 실행기 등) */
export function createMemoryBudget(limit: number): CallBudget {
  let used = 0;
  return {
    async take() {
      if (used >= limit) {
        throw new ProviderError(
          'BUDGET_EXCEEDED',
          `이번 실행의 Gemini 호출 상한(${limit})에 닿았습니다`,
        );
      }
      used += 1;
    },
  };
}
