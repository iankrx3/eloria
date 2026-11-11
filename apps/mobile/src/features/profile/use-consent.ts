import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';

/** 광고성 정보 수신 동의 문구 버전. 문구가 바뀌면 올린다. */
export const MARKETING_CONSENT_VERSION = 'marketing-v1';

/**
 * 혜택·이벤트 소식 동의(Figma P02, 기본 꺼짐). consents는 기록을 쌓는 표라 가장 최근 행으로 판단하고,
 * 바꿀 때마다 새 행을 남긴다(언제 동의·철회했는지 증빙).
 */
export function useMarketingConsent() {
  const auth = useAuth();
  const userId = auth.status === 'signed-in' ? auth.session.user.id : undefined;
  const queryClient = useQueryClient();
  const key = ['consent', 'marketing', userId] as const;

  const query = useQuery({
    queryKey: key,
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consents')
        .select('granted')
        .eq('user_id', userId!)
        .eq('kind', 'marketing')
        .order('granted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.granted ?? false;
    },
  });

  const set = useMutation({
    mutationFn: async (granted: boolean) => {
      if (!userId) throw new Error('no session');
      const { error } = await supabase.from('consents').insert({
        user_id: userId,
        kind: 'marketing',
        version: MARKETING_CONSENT_VERSION,
        granted,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return { granted: query.data ?? false, set, isPending: query.isPending };
}
