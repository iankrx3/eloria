import { LIMITS, seoulDayRange } from '@eloria/shared';
import type { AdminClient } from '../lib/supabase-admin';

/**
 * 직접 소원(고른 장면)과 이야기 수정이 오늘 자리를 몇 개 쓰는지.
 * 실패는 빠진다. 진행 중은 자리를 잡고, 끝나서 실패하면 다음 요청이 그 자리를 다시 쓴다.
 * 오늘의 이야기(kind = daily)와 퀴즈 직후 첫 이야기(장면 없음)는 세지 않는다.
 */
export async function countCustomWishSlots(db: AdminClient, userId: string, now: Date) {
  const { start, end } = seoulDayRange(now);
  const { data, error } = await db
    .from('stories')
    .select('vision, revision_request')
    .eq('user_id', userId)
    .eq('kind', 'on_demand')
    .neq('status', 'failed')
    .gte('created_at', start)
    .lt('created_at', end);
  if (error) throw error;
  return (data ?? []).filter(
    (row) => row.vision != null || (row.revision_request != null && row.revision_request.length > 0),
  ).length;
}

export function wishSlotLeft(used: number) {
  return used < LIMITS.CUSTOM_WISHES_PER_DAY;
}
