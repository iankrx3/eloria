import { storyStatusSchema, type StoryStatus } from '@eloria/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type StoryView = {
  id: string;
  status: StoryStatus;
  title: string | null;
  script: string | null;
  errorCode: string | null;
};

const storyKey = (id: string) => ['story', id] as const;
const COLUMNS = 'id, status, title, script, error_code';

function toView(row: {
  id: string;
  status: string;
  title: string | null;
  script: string | null;
  error_code: string | null;
}): StoryView {
  return {
    id: row.id,
    status: storyStatusSchema.parse(row.status),
    title: row.title,
    script: row.script,
    errorCode: row.error_code,
  };
}

/** 스토리 한 건(RLS: 본인 것만). 읽기는 Supabase에서 직접 한다(ARCHITECTURE 1절). */
export function useStory(storyId: string) {
  return useQuery({
    queryKey: storyKey(storyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select(COLUMNS)
        .eq('id', storyId)
        .single();
      if (error) throw error;
      return toView(data);
    },
  });
}

/**
 * 생성 진행 중 상태 변화를 Realtime으로 받아 캐시를 갱신한다(ARCHITECTURE 2.1).
 * 변경 알림에는 스크립트처럼 긴 값이 빠질 수 있어 알림이 오면 행을 다시 읽는다.
 */
export function useStoryRealtime(storyId: string, enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel(`story:${storyId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stories', filter: `id=eq.${storyId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: storyKey(storyId) });
        },
      )
      .subscribe((status) => {
        // 구독이 붙기 전에 바뀐 상태를 놓치지 않게 연결되면 한 번 다시 읽는다.
        if (status === 'SUBSCRIBED') {
          void queryClient.invalidateQueries({ queryKey: storyKey(storyId) });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [storyId, enabled, queryClient]);
}
