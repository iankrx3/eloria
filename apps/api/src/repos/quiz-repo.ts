import type { Person, QuizQuestionKey } from '@eloria/shared';
import type { AdminClient } from '../lib/supabase-admin';

export type ProfileUpdate = {
  display_name?: string;
  relationship_status?: string;
  tone?: string;
  listen_time?: string;
  notify_at?: string;
};

export type ProfileRow = {
  display_name: string | null;
  relationship_status: string | null;
  tone: string | null;
  listen_time: string | null;
  notify_at: string | null;
};

export interface QuizRepo {
  upsertAnswer(userId: string, key: QuizQuestionKey, answer: unknown): Promise<void>;
  listAnswers(userId: string): Promise<{ question_key: string; answer: unknown }[]>;
  /** 프로필을 갱신하고 퀴즈의 소중한 사람 목록으로 people을 바꾼다. */
  completeQuiz(userId: string, profile: ProfileUpdate, people: Person[]): Promise<ProfileRow>;
}

export function createSupabaseQuizRepo(db: AdminClient): QuizRepo {
  return {
    async upsertAnswer(userId, key, answer) {
      const { error } = await db
        .from('quiz_answers')
        .upsert(
          { user_id: userId, question_key: key, answer: answer as never },
          { onConflict: 'user_id,question_key' },
        );
      if (error) throw error;
    },

    async listAnswers(userId) {
      const { data, error } = await db
        .from('quiz_answers')
        .select('question_key, answer')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },

    // supabase-js에는 트랜잭션이 없다. 중간에 실패해도 다시 호출하면 같은 결과가 되도록 순서를 둔다.
    async completeQuiz(userId, profile, people) {
      const { error: deleteError } = await db.from('people').delete().eq('user_id', userId);
      if (deleteError) throw deleteError;

      if (people.length > 0) {
        const { error: insertError } = await db
          .from('people')
          .insert(people.map((p) => ({ user_id: userId, name: p.name, relation: p.relation })));
        if (insertError) throw insertError;
      }

      const { data, error } = await db
        .from('profiles')
        .update(profile)
        .eq('id', userId)
        .select('display_name, relationship_status, tone, listen_time, notify_at')
        .single();
      if (error) throw error;
      return data;
    },
  };
}
