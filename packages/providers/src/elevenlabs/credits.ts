import { ProviderError } from '../gemini/gemini';

/**
 * 글자당 크레딧(2026-11-14 공식 문서). v3·Multilingual v2는 1, Flash·Turbo v2.5는 0.5.
 * 표에 없는 모델은 1로 계산한다(상한을 넘기지 않게 보수적으로).
 */
export const ELEVENLABS_CREDITS_PER_CHAR: Record<string, number> = {
  eleven_v3: 1,
  eleven_multilingual_v2: 1,
  eleven_flash_v2_5: 0.5,
  eleven_turbo_v2_5: 0.5,
};

/** 요청 1회 최대 글자 수(공식 모델 표). 넘으면 API가 거절하므로 보내기 전에 막는다. */
export const ELEVENLABS_MAX_CHARS: Record<string, number> = {
  eleven_v3: 5_000,
  eleven_multilingual_v2: 10_000,
  eleven_flash_v2_5: 40_000,
  eleven_turbo_v2_5: 40_000,
};

export function ttsCredits(model: string, chars: number) {
  return Math.ceil(chars * (ELEVENLABS_CREDITS_PER_CHAR[model] ?? 1));
}

/** 기본 상한: 무료 플랜(월 10,000크레딧)과 사용자가 정한 회당 1,000크레딧(D-49). */
export const DEFAULT_TTS_CREDITS_PER_CALL = 1_000;
export const DEFAULT_TTS_CREDITS_PER_MONTH = 10_000;

/** 음성 호출 전에 크레딧을 잡는다. 넘으면 BUDGET_EXCEEDED를 던지고 API는 부르지 않는다. */
export interface TtsCreditBudget {
  take(credits: number): Promise<void>;
}

function checkPerCall(credits: number, perCall: number) {
  if (credits > perCall) {
    throw new ProviderError(
      'BUDGET_EXCEEDED',
      `음성 1회 크레딧 상한(${perCall})을 넘습니다: ${credits}크레딧 필요`,
    );
  }
}

/**
 * 월 상한(UTC 달력 월). `countUsed`는 이번 달 기록된 크레딧(generation_jobs의 elevenlabs 행)이다.
 * 기록은 호출이 끝난 뒤에 쌓이므로 이 프로세스가 이번 달 잡은 양과 비교해 큰 값으로 센다.
 * ElevenLabs의 실제 초기화일은 가입일 기준이라 다를 수 있다. 그때는 ElevenLabs가 quota_exceeded로 거절한다.
 */
export function createMonthlyTtsBudget(opts: {
  perCall: number;
  perMonth: number;
  countUsed: (sinceIso: string) => Promise<number>;
  now?: () => Date;
}): TtsCreditBudget {
  const now = opts.now ?? (() => new Date());
  let month = '';
  let taken = 0;
  return {
    async take(credits) {
      checkPerCall(credits, opts.perCall);
      const current = now().toISOString().slice(0, 7);
      if (current !== month) {
        month = current;
        taken = 0;
      }
      const used = Math.max(await opts.countUsed(`${current}-01T00:00:00.000Z`), taken);
      if (used + credits > opts.perMonth) {
        throw new ProviderError(
          'BUDGET_EXCEEDED',
          `이번 달 음성 크레딧 상한(${opts.perMonth})을 넘습니다: 사용 ${used} + 필요 ${credits}`,
        );
      }
      taken = used + credits;
    },
  };
}

/** 기록 없이 프로세스 안에서만 세는 상한(스크립트용) */
export function createMemoryTtsBudget(opts: { perCall: number; total: number }): TtsCreditBudget {
  let used = 0;
  return {
    async take(credits) {
      checkPerCall(credits, opts.perCall);
      if (used + credits > opts.total) {
        throw new ProviderError(
          'BUDGET_EXCEEDED',
          `이번 실행의 음성 크레딧 상한(${opts.total})을 넘습니다: 사용 ${used} + 필요 ${credits}`,
        );
      }
      used += credits;
    },
  };
}
