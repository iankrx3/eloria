import {
  challengeState,
  isRecordedDay,
  localDay,
  streakStats,
  type ActivityDay,
} from '@eloria/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-provider';
import { useProfile, useUpdateSettings } from '@/features/profile/use-profile';
import { haptic } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

function useUserId() {
  const auth = useAuth();
  return auth.status === 'signed-in' ? auth.session.user.id : undefined;
}

const activityKey = (userId: string | undefined) => ['activity', userId] as const;
const challengeKey = (userId: string | undefined) => ['challenge', userId] as const;

/** 오늘 날짜(프로필 시간대) */
export function useToday() {
  const tz = useProfile().data?.timezone ?? undefined;
  return localDay(new Date(), tz);
}

/** 활동 기록(최근 1년). 연속 기록·달력·통계를 여기서 만든다(Figma H11). */
export function useActivity() {
  const userId = useUserId();
  const today = useToday();
  const query = useQuery({
    queryKey: activityKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<ActivityDay[]> => {
      const { data, error } = await supabase
        .from('activity_days')
        .select('day, stories_listened, affirmations_done')
        .eq('user_id', userId!)
        .order('day', { ascending: false })
        .limit(400);
      if (error) throw error;
      return data.map((d) => ({
        day: d.day,
        storiesListened: d.stories_listened,
        affirmationsDone: d.affirmations_done,
      }));
    },
  });
  const days = query.data ?? [];
  const recorded = days.filter(isRecordedDay).map((d) => d.day);
  return {
    ...query,
    today,
    recorded: new Set(recorded),
    stats: streakStats(recorded, today),
    storiesListened: days.reduce((sum, d) => sum + d.storiesListened, 0),
  };
}

/**
 * 오늘 활동을 더한다(이야기 끝까지 들음 +1, 확언 n장). 사용자 자신의 기록이라 RLS로 직접 쓴다.
 * 그날 처음 기록이 채워지면 success 햅틱(Figma H11: 기록 달성 = success).
 */
export function useRecordActivity() {
  const userId = useUserId();
  const today = useToday();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (delta: { stories?: number; affirmations?: number }) => {
      if (!userId) throw new Error('no session');
      const { data: current, error: readError } = await supabase
        .from('activity_days')
        .select('stories_listened, affirmations_done')
        .eq('user_id', userId)
        .eq('day', today)
        .maybeSingle();
      if (readError) throw readError;
      const before: ActivityDay = {
        day: today,
        storiesListened: current?.stories_listened ?? 0,
        affirmationsDone: current?.affirmations_done ?? 0,
      };
      const after: ActivityDay = {
        day: today,
        storiesListened: before.storiesListened + (delta.stories ?? 0),
        affirmationsDone: Math.min(100, before.affirmationsDone + (delta.affirmations ?? 0)),
      };
      const { error } = await supabase.from('activity_days').upsert({
        user_id: userId,
        day: today,
        stories_listened: after.storiesListened,
        affirmations_done: after.affirmationsDone,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return { newlyRecorded: !isRecordedDay(before) && isRecordedDay(after) };
    },
    onSuccess: ({ newlyRecorded }) => {
      if (newlyRecorded) haptic('success');
      void queryClient.invalidateQueries({ queryKey: activityKey(userId) });
    },
  });
}

export type Mission = { day: number; kind: string; title: string; body: string };

/** 21일 챌린지(Figma H12): 미션·진행·시작·완료 */
export function useChallenge() {
  const userId = useUserId();
  const today = useToday();
  const profile = useProfile();
  const startedOn = profile.data?.challengeStartedOn ?? null;

  const missions = useQuery({
    queryKey: ['challenge-missions'],
    enabled: Boolean(userId),
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<Mission[]> => {
      const { data, error } = await supabase
        .from('challenge_missions')
        .select('day, kind, title, body')
        .order('day');
      if (error) throw error;
      return data;
    },
  });

  const progress = useQuery({
    queryKey: challengeKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_progress')
        .select('day, completed_at')
        .eq('user_id', userId!)
        .order('day');
      if (error) throw error;
      return data.map((p) => ({
        day: p.day,
        completedOn: localDay(new Date(p.completed_at), profile.data?.timezone ?? undefined),
      }));
    },
  });

  const state = challengeState(startedOn, progress.data ?? [], today);
  const nextDay = state.finished ? null : state.completed + 1;
  return {
    missions,
    progress,
    state,
    startedOn,
    today,
    /** 오늘 보여 줄 미션(오늘 이미 했으면 다음 미션을 미리 보여 준다) */
    mission: missions.data?.find((m) => m.day === nextDay) ?? null,
  };
}

export function useStartChallenge() {
  const update = useUpdateSettings();
  const today = useToday();
  return useMutation({
    mutationFn: () => update.mutateAsync({ challengeStartedOn: today }),
  });
}

export function useCompleteMission() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ day, note }: { day: number; note?: string }) => {
      if (!userId) throw new Error('no session');
      const { error } = await supabase
        .from('challenge_progress')
        .insert({ user_id: userId, day, note: note?.trim() || null });
      // 이미 완료한 날을 다시 누른 경우(기본 키 중복)는 성공으로 본다.
      if (error && error.code !== '23505') throw error;
      return day;
    },
    onSuccess: (day) => {
      haptic(day >= 21 ? 'heavy' : 'success');
      void queryClient.invalidateQueries({ queryKey: challengeKey(userId) });
    },
  });
}
