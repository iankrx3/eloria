import { libraryCategorySchema, wishThemeSchema } from '@eloria/shared';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import type { RitualItem } from './group-rituals';

/**
 * 리추얼 목록(공용 Library, RLS: 로그인 사용자 조회). 완성된(ready) 스토리만 보인다.
 * 읽기는 Supabase에서 직접 한다(ARCHITECTURE 1절). 음성은 서버가 서명한다(GET /v1/stories/:id/media).
 */
export function useRituals() {
  const auth = useAuth();
  return useQuery({
    queryKey: ['rituals'],
    enabled: auth.status === 'signed-in',
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<RitualItem[]> => {
      const { data, error } = await supabase
        .from('library_items')
        .select(
          'seed_key, category, wish_theme, sort, is_free, stories!inner(id, title, status, created_at, story_assets(type, duration_sec))',
        )
        .eq('stories.status', 'ready');
      if (error) throw error;
      return data.map((row) => ({
        storyId: row.stories.id,
        seedKey: row.seed_key,
        category: libraryCategorySchema.parse(row.category),
        wishTheme: row.wish_theme ? wishThemeSchema.parse(row.wish_theme) : null,
        createdAt: row.stories.created_at,
        title: row.stories.title,
        durationSec: row.stories.story_assets.find((a) => a.type === 'audio')?.duration_sec ?? null,
        sort: row.sort,
        isFree: row.is_free,
      }));
    },
  });
}
