import type { AdminClient } from '../lib/supabase-admin';

export interface DailyRepo {
  /** 앱을 연 사용자 표시(데일리 사전 생성 대상 판단, DATA_MODEL profiles.last_active_at) */
  touchActive(userId: string): Promise<void>;
  timezone(userId: string): Promise<string | null>;
  findDaily(userId: string, day: string): Promise<string | null>;
  /** 이야기를 만들 꿈: 가장 최근의 진행 중인 꿈 */
  latestDesireId(userId: string): Promise<string | null>;
  /** 데일리 스토리와 생성 작업 행. 같은 날 이미 있으면(동시 요청) 그 id를 돌려준다. */
  createDaily(
    userId: string,
    desireId: string,
    day: string,
  ): Promise<{ storyId: string; created: boolean }>;
  /** 최근 활동한 사용자(사전 생성 대상) */
  activeUserIds(sinceIso: string, limit: number): Promise<string[]>;
}

const UNIQUE_VIOLATION = '23505';

export function createSupabaseDailyRepo(db: AdminClient): DailyRepo {
  const findDaily = async (userId: string, day: string) => {
    const { data, error } = await db
      .from('stories')
      .select('id')
      .eq('user_id', userId)
      .eq('daily_on', day)
      .maybeSingle();
    if (error) throw error;
    return data?.id ?? null;
  };

  return {
    async touchActive(userId) {
      const { error } = await db
        .from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
    },

    async timezone(userId) {
      const { data, error } = await db
        .from('profiles')
        .select('timezone')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data.timezone;
    },

    findDaily,

    async latestDesireId(userId) {
      const { data, error } = await db
        .from('desires')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },

    async createDaily(userId, desireId, day) {
      const { data: story, error } = await db
        .from('stories')
        .insert({ user_id: userId, desire_id: desireId, kind: 'daily', version: 1, daily_on: day })
        .select('id')
        .single();
      if (error) {
        if (error.code === UNIQUE_VIOLATION) {
          const existing = await findDaily(userId, day);
          if (existing) return { storyId: existing, created: false };
        }
        throw error;
      }
      const { error: jobError } = await db.from('generation_jobs').insert({
        user_id: userId,
        story_id: story.id,
        kind: 'daily',
        step: 'queued',
        status: 'pending',
      });
      if (jobError) throw jobError;
      return { storyId: story.id, created: true };
    },

    async activeUserIds(sinceIso, limit) {
      const { data, error } = await db
        .from('profiles')
        .select('id')
        .gte('last_active_at', sinceIso)
        .not('onboarding_completed_at', 'is', null)
        .order('last_active_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data.map((p) => p.id);
    },
  };
}
