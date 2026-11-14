import type { LifestyleContext } from '@eloria/prompts';
import type { Usage } from '@eloria/providers';
import {
  collectQuizAnswers,
  recentLineFromStory,
  type AffirmationItem,
  type QuizAnswers,
} from '@eloria/shared';
import { z } from 'zod';
import type { AdminClient } from '../lib/supabase-admin';

export type AffirmationUserContext = {
  timezone: string | null;
  context: LifestyleContext;
  quiz: Partial<QuizAnswers>;
  recentLines: string[];
};

/** 사용자 한 명이 부르는 Gemini 기능(generation_jobs.kind) */
export type PersonalJobKind = 'affirmation' | 'lifestyle' | 'vision';

export type NewAffirmation = { text: string; theme: string };

export interface AffirmationRepo {
  loadUser(userId: string): Promise<AffirmationUserContext>;
  /** 그날의 통과한 확언(position 순) */
  listForDay(userId: string, day: string): Promise<AffirmationItem[]>;
  /** 그날 오늘의 이야기에 들어 있는 확언 3개. 없거나 아직 글이 없으면 null. */
  dailyAffirmations(userId: string, day: string): Promise<string[] | null>;
  /** 이 기능으로 부른 Gemini 호출 기록 수(시도 상한용) */
  countCallsSince(userId: string, kind: PersonalJobKind, sinceIso: string): Promise<number>;
  recordCall(call: {
    userId: string;
    kind: PersonalJobKind;
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
          .select('display_name, likes, dislikes, desired_changes, timezone, location, occupation')
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

      const recent = await db
        .from('stories')
        .select('title, script, affirmations')
        .eq('user_id', userId)
        .in('status', ['text_ready', 'audio_ready', 'ready'])
        .order('created_at', { ascending: false })
        .limit(3);
      if (recent.error) throw recent.error;

      const answers = collectQuizAnswers(quiz.data);
      return {
        timezone: profile.data.timezone,
        quiz: answers,
        recentLines: (recent.data ?? []).map((row) =>
          recentLineFromStory({
            title: row.title,
            script: row.script,
            affirmations: Array.isArray(row.affirmations)
              ? row.affirmations.filter((line): line is string => typeof line === 'string')
              : null,
          }),
        ),
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
          location: profile.data.location,
          occupation: profile.data.occupation,
        },
      };
    },

    async dailyAffirmations(userId, day) {
      const { data, error } = await db
        .from('stories')
        .select('affirmations')
        .eq('user_id', userId)
        .eq('kind', 'daily')
        .eq('daily_on', day)
        .in('status', ['text_ready', 'audio_ready', 'ready'])
        .maybeSingle();
      if (error) throw error;
      const parsed = z.array(z.string().min(1)).length(3).safeParse(data?.affirmations);
      return parsed.success ? parsed.data : null;
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

    async countCallsSince(userId, kind, sinceIso) {
      const { count, error } = await db
        .from('generation_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('kind', kind)
        .gte('started_at', sinceIso);
      if (error) throw error;
      return count ?? 0;
    },

    async recordCall({ userId, kind, step, usage, startedAt, finishedAt }) {
      const { error } = await db.from('generation_jobs').insert({
        user_id: userId,
        kind,
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
