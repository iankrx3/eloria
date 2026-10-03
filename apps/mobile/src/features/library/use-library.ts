import { storyStatusSchema } from '@eloria/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-provider';
import { authedApi } from '@/lib/authed-api';
import { supabase } from '@/lib/supabase';
import type { LibraryStory } from './group-stories';

const LIST_LIMIT = 100;

function useUserId() {
  const auth = useAuth();
  return auth.status === 'signed-in' ? auth.session.user.id : undefined;
}

export const libraryKeys = {
  stories: (userId: string | undefined) => ['library', 'stories', userId] as const,
  favorites: (userId: string | undefined) => ['library', 'favorites', userId] as const,
};

/** 내 스토리 목록(RLS: 본인 것만, 공용 Library는 제외). 최신순. */
export function useMyStories() {
  const userId = useUserId();
  return useQuery({
    queryKey: libraryKeys.stories(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<LibraryStory[]> => {
      const { data, error } = await supabase
        .from('stories')
        .select(
          'id, status, title, created_at, error_code, desires(id, text), story_assets(type, duration_sec)',
        )
        .eq('user_id', userId!)
        .neq('kind', 'library')
        .order('created_at', { ascending: false })
        .limit(LIST_LIMIT);
      if (error) throw error;
      return data.map((row) => ({
        id: row.id,
        status: storyStatusSchema.parse(row.status),
        title: row.title,
        createdAt: row.created_at,
        errorCode: row.error_code,
        desire: row.desires ? { id: row.desires.id, text: row.desires.text } : null,
        durationSec: row.story_assets.find((a) => a.type === 'audio')?.duration_sec ?? null,
      }));
    },
  });
}

/** 좋아요한 스토리 id 집합 */
export function useFavorites() {
  const userId = useUserId();
  return useQuery({
    queryKey: libraryKeys.favorites(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('story_id')
        .eq('user_id', userId!);
      if (error) throw error;
      return new Set(data.map((f) => f.story_id));
    },
  });
}

/** 좋아요 켜기/끄기. 사용자 소유 테이블이라 RLS로 직접 쓴다. 누르는 즉시 화면에 반영하고 실패하면 되돌린다. */
export function useToggleFavorite() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const key = libraryKeys.favorites(userId);

  return useMutation({
    mutationFn: async ({ storyId, liked }: { storyId: string; liked: boolean }) => {
      if (!userId) throw new Error('no session');
      const { error } = liked
        ? await supabase.from('favorites').insert({ user_id: userId, story_id: storyId })
        : await supabase.from('favorites').delete().eq('user_id', userId).eq('story_id', storyId);
      // 이미 좋아요한 상태에서 다시 누른 경우(유니크 위반)는 성공으로 본다.
      if (error && error.code !== '23505') throw error;
    },
    onMutate: async ({ storyId, liked }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Set<string>>(key);
      const next = new Set(previous);
      if (liked) next.add(storyId);
      else next.delete(storyId);
      queryClient.setQueryData(key, next);
      return { previous };
    },
    onError: (_e, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

/** 스토리 삭제(DELETE /v1/stories/:id). 음성 파일까지 서버가 지운다. */
export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storyId: string) => authedApi(`/v1/stories/${storyId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['library'] }),
  });
}
