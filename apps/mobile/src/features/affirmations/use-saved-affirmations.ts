import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';

/** 저장한 확언 개수(마이 숫자). 목록 화면(A04)은 확언 생성(C단계)과 함께 만든다. */
export function useSavedAffirmationCount() {
  const auth = useAuth();
  const userId = auth.status === 'signed-in' ? auth.session.user.id : undefined;
  return useQuery({
    queryKey: ['saved-affirmations', 'count', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('saved_affirmations')
        .select('affirmation_id', { count: 'exact', head: true })
        .eq('user_id', userId!);
      if (error) throw error;
      return count ?? 0;
    },
  });
}
