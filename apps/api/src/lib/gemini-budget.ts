import { createDailyBudget, type CallBudget } from '@eloria/providers';
import type { AdminClient } from './supabase-admin';

/**
 * 서버 전체 하루 Gemini 호출 상한. 오늘(UTC) generation_jobs에 기록된 gemini 호출 수로 센다(D-45).
 */
export function createGeminiBudget(db: AdminClient, limit: number): CallBudget {
  return createDailyBudget({
    limit,
    countUsed: async (sinceIso) => {
      const { count, error } = await db
        .from('generation_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('provider', 'gemini')
        .gte('started_at', sinceIso);
      if (error) throw error;
      return count ?? 0;
    },
  });
}
