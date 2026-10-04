import type { AdminClient } from '../lib/supabase-admin';
import type { LibraryRepo } from '../library/seed';

export function createSupabaseLibraryRepo(db: AdminClient): LibraryRepo {
  return {
    async listSeedKeys() {
      const { data, error } = await db.from('library_items').select('seed_key');
      if (error) throw error;
      return data.map((r) => r.seed_key);
    },

    // 트랜잭션이 없어 중간에 실패하면 주인 없는 스토리 행이 남을 수 있다. seed_key가 유일해서
    // 다시 돌려도 항목이 겹치지는 않고, 남은 queued 스토리는 리추얼 목록(ready만 보임)에 나오지 않는다.
    async createItem({ key, category, theme, tone, sort, isFree }) {
      const { data: story, error: storyError } = await db
        .from('stories')
        .insert({ user_id: null, kind: 'library', version: 1 })
        .select('id')
        .single();
      if (storyError) throw storyError;

      const { error: itemError } = await db.from('library_items').insert({
        story_id: story.id,
        category,
        seed_key: key,
        theme,
        tone,
        sort,
        is_free: isFree,
      });
      if (itemError) throw itemError;

      const { error: jobError } = await db.from('generation_jobs').insert({
        user_id: null,
        story_id: story.id,
        kind: 'library',
        step: 'queued',
        status: 'pending',
      });
      if (jobError) throw jobError;

      return story.id;
    },
  };
}
