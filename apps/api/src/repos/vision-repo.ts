import { visionListSchema, type DesireCategory, type Vision } from '@eloria/shared';
import { countCustomWishSlots as countSlots } from '../quota/custom-wish';
import type { AdminClient } from '../lib/supabase-admin';

export interface VisionRepo {
  createDesire(userId: string, input: { text: string; category: DesireCategory }): Promise<string>;
  saveVisions(desireId: string, visions: Vision[]): Promise<void>;
  /** 본인 꿈의 장면들. 없거나 남의 것이면 null. */
  findVisions(userId: string, desireId: string): Promise<Vision[] | null>;
  /** 고른 장면으로 스토리(on_demand, vision)와 생성 작업 행을 만든다. */
  createVisionStory(userId: string, desireId: string, vision: Vision): Promise<string>;
  /** 오늘(한국 시간) 직접 소원·수정이 잡고 있는 자리. 실패는 빠진다. */
  countCustomWishSlots(userId: string, now: Date): Promise<number>;
  /** 큐에 넣기 실패로 자리를 돌려줄 때. 스토리 상태 실패는 StoryRepo.markFailed가 한다. */
  releaseWishSlot(storyId: string): Promise<void>;
}

export function createSupabaseVisionRepo(db: AdminClient): VisionRepo {
  return {
    async createDesire(userId, { text, category }) {
      const { data, error } = await db
        .from('desires')
        .insert({ user_id: userId, text, category })
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },

    async saveVisions(desireId, visions) {
      const { error } = await db.from('desires').update({ visions }).eq('id', desireId);
      if (error) throw error;
    },

    async findVisions(userId, desireId) {
      const { data, error } = await db
        .from('desires')
        .select('visions')
        .eq('id', desireId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      // JSON 컬럼은 zod로 검증한다(CLAUDE.md). 깨졌으면 장면이 없는 것으로 본다.
      return visionListSchema.safeParse(data.visions ?? []).data ?? [];
    },

    async createVisionStory(userId, desireId, vision) {
      const { data: story, error: storyError } = await db
        .from('stories')
        .insert({ user_id: userId, desire_id: desireId, kind: 'on_demand', version: 1, vision })
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
      return story.id;
    },

    async countCustomWishSlots(userId, now) {
      return countSlots(db, userId, now);
    },

    releaseWishSlot() {
      return Promise.resolve();
    },
  };
}
