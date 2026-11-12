import type { AffirmationContext } from '@eloria/prompts';
import type { Usage } from '@eloria/providers';
import { collectQuizAnswers, type AffirmationItem } from '@eloria/shared';
import type { AdminClient } from '../lib/supabase-admin';

export type AffirmationUserContext = { timezone: string | null; context: AffirmationContext };

export type NewAffirmation = { text: string; theme: string };

export interface AffirmationRepo {
  loadUser(userId: string): Promise<AffirmationUserContext>;
  /** 그날의 통과한 확언(position 순) */
  listForDay(userId: string, day: string): Promise<AffirmationItem[]>;
  /** 그날 확언을 만들려고 부른 Gemini 호출 수(시도 상한용) */
  countCallsSince(userId: string, sinceIso: string): Promise<number>;
  recordCall(call: {
    userId: string;
    step: string;
    usage: Usage;
    startedAt: string;
    finishedAt: string;
  }): Promise<void>;
  /** 저장한다. 같은 날 이미 있으면(동시 요청) 아무것도 하지 않는다. */
  saveDay(
    userId: string,
    day: string,
    items: NewAffirmation[],
    promptVersion: string,
  ): Promise<void>;
}

export function createSupabaseAffirmationRepo(db: AdminClient): AffirmationRepo {
  return {
    async loadUser(userId) {
      const [profile, people, quiz, desire] = await Promise.all([
        db
          .from('profiles')
          .select('display_name, likes, dislikes, desired_changes, timezone')
          .eq('id', userId)
          .single(),
        db.from('people').select('name, relation').eq('user_id', userId),
        db.from('quiz_answers').select('question_key, answer').eq('user_id', userId),
        db
          .from('desires')
          .select('text')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (profile.error) throw profile.error;
      if (people.error) throw people.error;
      if (quiz.error) throw quiz.error;
      if (desire.error) throw desire.error;

      const answers = collectQuizAnswers(quiz.data);
      return {
        timezone: profile.data.timezone,
        context: {
          // 퀴즈의 "이루고 싶은 것"이 먼저, 없으면 가장 최근 꿈
          dream: answers.desire ?? desire.data?.text ?? '',
          displayName: profile.data.display_name,
          tone: 'calm',
          people: people.data,
          age: answers.age,
          gender: answers.gender,
          desireWhy: answers.desire_why,
          loveDesired: answers.love_desired ?? undefined,
          dreamHome: answers.dream_home,
          dreamDays: answers.dream_days,
          likes: profile.data.likes,
          dislikes: profile.data.dislikes,
          blocker: answers.desire_blocker,
          changes: profile.data.desired_changes,
        },
      };
    },

    async listForDay(userId, day) {
      const { data, error } = await db
        .from('affirmations')
        .select('id, position, text, theme')
        .eq('user_id', userId)
        .eq('day', day)
        .eq('status', 'approved')
        .order('position');
      if (error) throw error;
      return data;
    },

    async countCallsSince(userId, sinceIso) {
      const { count, error } = await db
        .from('generation_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('kind', 'affirmation')
        .gte('started_at', sinceIso);
      if (error) throw error;
      return count ?? 0;
    },

    async recordCall({ userId, step, usage, startedAt, finishedAt }) {
      const { error } = await db.from('generation_jobs').insert({
        user_id: userId,
        kind: 'affirmation',
        step,
        status: 'succeeded',
        attempts: 1,
        provider: usage.provider,
        model: usage.model,
        input_tokens: usage.inputTokens ?? null,
        output_tokens: usage.outputTokens ?? null,
        est_cost_usd: usage.estCostUsd,
        started_at: startedAt,
        finished_at: finishedAt,
      });
      if (error) throw error;
    },

    async saveDay(userId, day, items, promptVersion) {
      const { error } = await db.from('affirmations').upsert(
        items.map((item, i) => ({
          user_id: userId,
          day,
          position: i + 1,
          text: item.text,
          theme: item.theme,
          status: 'approved',
          prompt_version: promptVersion,
        })),
        { onConflict: 'user_id,day,position', ignoreDuplicates: true },
      );
      if (error) throw error;
    },
  };
}
