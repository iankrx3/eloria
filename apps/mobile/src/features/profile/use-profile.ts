import { toCamel } from '@eloria/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';

const profileKey = (userId: string | undefined) => ['profile', userId] as const;

/** 본인 프로필(RLS: 본인 행만). 가입 트리거가 빈 행을 만들어 두므로 항상 1행이다. */
export function useProfile() {
  const auth = useAuth();
  const userId = auth.status === 'signed-in' ? auth.session.user.id : undefined;

  return useQuery({
    queryKey: profileKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, onboarding_completed_at')
        .eq('id', userId!)
        .single();
      if (error) throw error;
      return toCamel(data);
    },
  });
}

/**
 * 온보딩 완료 표시. 권한·원가와 무관한 사용자 자신의 상태라 RLS 본인 수정으로 직접 쓴다.
 * `null`을 넘기면 다시 온보딩을 보여 준다(개발용).
 */
export function useSetOnboardingCompleted() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const userId = auth.status === 'signed-in' ? auth.session.user.id : undefined;

  return useMutation({
    mutationFn: async (completed: boolean) => {
      if (!userId) throw new Error('로그인 세션이 없습니다.');
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed_at: completed ? new Date().toISOString() : null })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey(userId) }),
  });
}
