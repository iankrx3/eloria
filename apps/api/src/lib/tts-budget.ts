import { createMonthlyTtsBudget, ttsCredits, type TtsCreditBudget } from '@eloria/providers';
import type { AdminClient } from './supabase-admin';

/**
 * 서버 전체 음성 크레딧 상한(D-49): 회당 `perCall`, 이번 달(UTC) `perMonth`.
 * 이번 달 generation_jobs의 elevenlabs 행을 글자 수 × 모델별 크레딧 배수로 더해 센다.
 */
export function createTtsBudget(
  db: AdminClient,
  limits: { perCall: number; perMonth: number },
): TtsCreditBudget {
  return createMonthlyTtsBudget({
    ...limits,
    countUsed: async (sinceIso) => {
      const { data, error } = await db
        .from('generation_jobs')
        .select('model, tts_chars')
        .eq('provider', 'elevenlabs')
        .gte('started_at', sinceIso);
      if (error) throw error;
      return (data ?? []).reduce(
        (sum, row) => sum + ttsCredits(row.model ?? '', row.tts_chars ?? 0),
        0,
      );
    },
  });
}
