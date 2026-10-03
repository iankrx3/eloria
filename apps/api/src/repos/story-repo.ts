import type { DesireCategory } from '@eloria/shared';
import type { AdminClient } from '../lib/supabase-admin';

export interface StoryRepo {
  /** 꿈(desire)과 첫 스토리(status=queued), 생성 작업 행을 만든다. */
  createManifest(
    userId: string,
    input: { text: string; category: DesireCategory },
  ): Promise<{ desireId: string; storyId: string }>;
  /** 작업 큐에 넣지 못했을 때 스토리를 실패로 표시한다. */
  markFailed(storyId: string, errorCode: string): Promise<void>;
}

export function createSupabaseStoryRepo(db: AdminClient): StoryRepo {
  return {
    async createManifest(userId, { text, category }) {
      const { data: desire, error: desireError } = await db
        .from('desires')
        .insert({ user_id: userId, text, category })
        .select('id')
        .single();
      if (desireError) throw desireError;

      const { data: story, error: storyError } = await db
        .from('stories')
        .insert({ user_id: userId, desire_id: desire.id, kind: 'on_demand', version: 1 })
        .select('id')
        .single();
      if (storyError) throw storyError;

      const { error: jobError } = await db.from('generation_jobs').insert({
        user_id: userId,
        story_id: story.id,
        kind: 'story',
        step: 'queued',
        status: 'pending',
      });
      if (jobError) throw jobError;

      return { desireId: desire.id, storyId: story.id };
    },

    async markFailed(storyId, errorCode) {
      const { error } = await db
        .from('stories')
        .update({ status: 'failed', error_code: errorCode })
        .eq('id', storyId);
      if (error) throw error;
    },
  };
}
