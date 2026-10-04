import type { DesireCategory, StoryStatus } from '@eloria/shared';
import type { AdminClient } from '../lib/supabase-admin';

/** 재생할 파일 정보. owner = 본인 스토리, library = 공용 리추얼 */
export type StoryMedia = {
  access: 'owner' | 'library';
  isFree: boolean;
  audioPath: string | null;
  coverPath: string | null;
};

export interface StoryRepo {
  /** 꿈(desire)과 첫 스토리(status=queued), 생성 작업 행을 만든다. */
  createManifest(
    userId: string,
    input: { text: string; category: DesireCategory },
  ): Promise<{ desireId: string; storyId: string }>;
  /** 작업 큐에 넣지 못했을 때 스토리를 실패로 표시한다. */
  markFailed(storyId: string, errorCode: string): Promise<void>;
  /** 본인 스토리의 상태와 오류 코드. 없거나 남의 것이면 null. */
  findOwnedStatus(
    userId: string,
    storyId: string,
  ): Promise<{ status: StoryStatus; errorCode: string | null } | null>;
  /**
   * 스토리와 그 음성·표지 파일을 지운다. 좋아요·에셋은 FK cascade로 같이 지워지고,
   * 생성 기록(generation_jobs)은 원가·한도 집계를 위해 남는다. 남은 스토리가 없는 꿈도 지운다.
   */
  deleteStory(userId: string, storyId: string): Promise<void>;
  /** 본인 스토리이거나 공용 리추얼이면 최신 음성·표지 경로. 볼 수 없으면 null. */
  findMedia(userId: string, storyId: string): Promise<StoryMedia | null>;
  /** service role로 서명 URL을 만든다(앱이 직접 서명할 수 없는 library 경로용). */
  signMedia(
    paths: { audio: string; cover: string | null },
    expiresInSec: number,
  ): Promise<{ audioUrl: string; coverUrl: string | null }>;
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

    async findOwnedStatus(userId, storyId) {
      const { data, error } = await db
        .from('stories')
        .select('status, error_code')
        .eq('id', storyId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data ? { status: data.status as StoryStatus, errorCode: data.error_code } : null;
    },

    async deleteStory(userId, storyId) {
      const { data: story, error } = await db
        .from('stories')
        .select('desire_id, story_assets(type, storage_path)')
        .eq('id', storyId)
        .eq('user_id', userId)
        .single();
      if (error) throw error;

      // 파일을 먼저 지운다. 행을 먼저 지우면 경로를 잃어 파일만 남을 수 있다.
      const bucketOf = (type: string) => (type === 'cover' ? 'story-covers' : 'story-audio');
      for (const bucket of ['story-audio', 'story-covers'] as const) {
        const paths = story.story_assets
          .filter((a) => bucketOf(a.type) === bucket)
          .map((a) => a.storage_path);
        if (paths.length === 0) continue;
        const { error: removeError } = await db.storage.from(bucket).remove(paths);
        if (removeError) throw removeError;
      }

      const { error: deleteError } = await db
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', userId);
      if (deleteError) throw deleteError;

      if (story.desire_id) {
        const { count, error: countError } = await db
          .from('stories')
          .select('id', { count: 'exact', head: true })
          .eq('desire_id', story.desire_id);
        if (countError) throw countError;
        if (count === 0) {
          const { error: desireError } = await db
            .from('desires')
            .delete()
            .eq('id', story.desire_id)
            .eq('user_id', userId);
          if (desireError) throw desireError;
        }
      }
    },

    async findMedia(userId, storyId) {
      const { data, error } = await db
        .from('stories')
        .select(
          'user_id, kind, library_items(is_free), story_assets(type, storage_path, created_at)',
        )
        .eq('id', storyId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const access = data.user_id === userId ? 'owner' : data.kind === 'library' ? 'library' : null;
      if (!access) return null;

      const latest = (type: string) =>
        data.story_assets
          .filter((a) => a.type === type)
          .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.storage_path ?? null;
      return {
        access,
        isFree: data.library_items?.is_free ?? false,
        audioPath: latest('audio'),
        coverPath: latest('cover'),
      };
    },

    async signMedia({ audio, cover }, expiresInSec) {
      const sign = async (bucket: 'story-audio' | 'story-covers', path: string) => {
        const { data, error } = await db.storage.from(bucket).createSignedUrl(path, expiresInSec);
        if (error) throw error;
        return data.signedUrl;
      };
      return {
        audioUrl: await sign('story-audio', audio),
        coverUrl: cover ? await sign('story-covers', cover) : null,
      };
    },
  };
}
