import { cleanGratitudeLines } from '@eloria/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToday } from '@/features/activity/use-activity';
import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';

export type GratitudeEntry = { day: string; lines: string[] };

const LIST_LIMIT = 60;
const key = (userId: string | undefined) => ['gratitude', userId] as const;

function useUserId() {
  const auth = useAuth();
  return auth.status === 'signed-in' ? auth.session.user.id : undefined;
}

/** 감사 일기 목록(최근순). 사용자 자신의 기록이라 RLS로 직접 읽고 쓴다. */
export function useGratitude() {
  const userId = useUserId();
  return useQuery({
    queryKey: key(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<GratitudeEntry[]> => {
      const { data, error } = await supabase
        .from('gratitude_entries')
        .select('day, lines')
        .eq('user_id', userId!)
        .order('day', { ascending: false })
        .limit(LIST_LIMIT);
      if (error) throw error;
      return data;
    },
  });
}

/** 오늘 일기 저장(하루 한 행, 다시 저장하면 덮어쓴다) */
export function useSaveGratitude() {
  const userId = useUserId();
  const today = useToday();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lines: string[]) => {
      if (!userId) throw new Error('no session');
      const clean = cleanGratitudeLines(lines);
      if (clean.length === 0) throw new Error('empty');
      const { error } = await supabase
        .from('gratitude_entries')
        .upsert({ user_id: userId, day: today, lines: clean }, { onConflict: 'user_id,day' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(userId) }),
  });
}
