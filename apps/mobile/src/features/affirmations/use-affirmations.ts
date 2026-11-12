import { todayAffirmationsResponseSchema } from '@eloria/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { authedApi } from '@/lib/authed-api';
import { haptic } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

function useUserId() {
  const auth = useAuth();
  return auth.status === 'signed-in' ? auth.session.user.id : undefined;
}

/** saved-affirmations로 시작하는 키(개수·목록)를 저장·해제 때 함께 새로 읽는다. */
const SAVED_KEY = 'saved-affirmations';

/** 오늘의 확언 10장(A01). 그날 처음 부르면 서버가 만든다(수 초). */
export function useTodayAffirmations() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['affirmations', 'today', userId],
    enabled: Boolean(userId),
    staleTime: 60 * 60 * 1000,
    queryFn: () => authedApi('/v1/affirmations/today', { schema: todayAffirmationsResponseSchema }),
  });
}

export type SavedAffirmation = {
  id: string;
  text: string;
  theme: string | null;
  savedAt: string;
};

/** 저장한 확언(A04), 최신순 */
export function useSavedAffirmations() {
  const userId = useUserId();
  return useQuery({
    queryKey: [SAVED_KEY, 'list', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<SavedAffirmation[]> => {
      const { data, error } = await supabase
        .from('saved_affirmations')
        .select('affirmation_id, saved_at, affirmations(text, theme)')
        .eq('user_id', userId!)
        .order('saved_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data.flatMap((row) =>
        row.affirmations
          ? [
              {
                id: row.affirmation_id,
                text: row.affirmations.text,
                theme: row.affirmations.theme,
                savedAt: row.saved_at,
              },
            ]
          : [],
      );
    },
  });
}

/** 저장·해제(Figma 햅틱: 저장 = success, 해제 = light). 사용자 자신의 기록이라 RLS로 직접 쓴다. */
export function useToggleSaveAffirmation() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, save }: { id: string; save: boolean }) => {
      if (!userId) throw new Error('no session');
      const { error } = save
        ? await supabase
            .from('saved_affirmations')
            .upsert({ user_id: userId, affirmation_id: id }, { ignoreDuplicates: true })
        : await supabase
            .from('saved_affirmations')
            .delete()
            .eq('user_id', userId)
            .eq('affirmation_id', id);
      if (error) throw error;
    },
    onMutate: ({ save }) => haptic(save ? 'success' : 'light'),
    onError: () => haptic('error'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [SAVED_KEY] }),
  });
}

type Progress = { day: string; index: number; done: boolean };
const PROGRESS_KEY = 'affirmations.progress';

/**
 * 오늘 몇 번째 카드까지 봤는지(앱을 다시 열어도 이어서), 10장을 다 넘겼는지. 기기에만 둔다.
 * 날이 바뀌면 처음부터.
 */
export function useAffirmationProgress(day: string | undefined) {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    if (!day) return;
    let alive = true;
    void AsyncStorage.getItem(PROGRESS_KEY).then((raw) => {
      if (!alive) return;
      const saved = raw ? (JSON.parse(raw) as Partial<Progress>) : null;
      setProgress(
        saved?.day === day && typeof saved.index === 'number'
          ? { day, index: saved.index, done: Boolean(saved.done) }
          : { day, index: 0, done: false },
      );
    });
    return () => {
      alive = false;
    };
  }, [day]);

  const update = useCallback((next: Partial<Omit<Progress, 'day'>>) => {
    setProgress((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...next };
      void AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  return { progress, update };
}
