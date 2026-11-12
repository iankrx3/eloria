import {
  dailyResponseSchema,
  visionListSchema,
  visionsResponseSchema,
  visionStoryResponseSchema,
  type VisionsRequest,
} from '@eloria/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-provider';
import { authedApi } from '@/lib/authed-api';
import { supabase } from '@/lib/supabase';

/** 꿈을 등록하고 장면 4개를 받는다(H04 → H05). 수 초 걸린다. */
export function useCreateVisions() {
  return useMutation({
    mutationFn: (input: VisionsRequest) =>
      authedApi('/v1/visions', { method: 'POST', body: input, schema: visionsResponseSchema }),
  });
}

/** 이미 만든 장면(다시 열었을 때). 본인 꿈이라 RLS로 직접 읽는다. */
export function useDesireVisions(desireId: string | undefined) {
  return useQuery({
    queryKey: ['visions', desireId],
    enabled: Boolean(desireId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('desires')
        .select('visions')
        .eq('id', desireId!)
        .single();
      if (error) throw error;
      return visionListSchema.parse(data.visions ?? []);
    },
  });
}

/** 고른 장면으로 이야기 생성 시작(H05 재생 → H06) */
export function useStartVisionStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ desireId, position }: { desireId: string; position: number }) =>
      authedApi(`/v1/visions/${desireId}/${position}/story`, {
        method: 'POST',
        schema: visionStoryResponseSchema,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['library'] }),
  });
}

/** 오늘의 이야기(H01 "당신을 위한 이야기" 매일 갱신). 홈을 열 때 서버가 없으면 만든다. */
export function useDaily() {
  const auth = useAuth();
  const userId = auth.status === 'signed-in' ? auth.session.user.id : undefined;
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['daily', userId],
    enabled: Boolean(userId),
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const res = await authedApi('/v1/daily', { method: 'POST', schema: dailyResponseSchema });
      // 새로 만들었으면 홈 목록에 바로 보이게 한다.
      void queryClient.invalidateQueries({ queryKey: ['library'] });
      return res;
    },
  });
}
