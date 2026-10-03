import { SignJWT } from 'jose';
import { createSupabaseVerifier } from '../middleware/auth';
import type { ProfileRow, ProfileUpdate, QuizRepo } from '../repos/quiz-repo';

export const SUPABASE_URL = 'http://127.0.0.1:54321';
const SECRET = 'test-secret-at-least-32-characters-long';

export const verifyToken = createSupabaseVerifier({ supabaseUrl: SUPABASE_URL, jwtSecret: SECRET });

export function sign(
  claims: Record<string, unknown>,
  opts: { issuer?: string; expiresIn?: string } = {},
) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(opts.issuer ?? `${SUPABASE_URL}/auth/v1`)
    .setAudience('authenticated')
    .setExpirationTime(opts.expiresIn ?? '1h')
    .sign(new TextEncoder().encode(SECRET));
}

/** 메모리 저장소. 사용자별로 분리돼 있는지도 함께 검증할 수 있다. */
export function createFakeQuizRepo() {
  const answers = new Map<string, Map<string, unknown>>();
  const profiles = new Map<string, ProfileRow>();
  const people = new Map<string, { name: string; relation: string }[]>();

  const repo: QuizRepo = {
    async upsertAnswer(userId, key, answer) {
      if (!answers.has(userId)) answers.set(userId, new Map());
      answers.get(userId)!.set(key, answer);
    },
    async listAnswers(userId) {
      return [...(answers.get(userId) ?? new Map()).entries()].map(([question_key, answer]) => ({
        question_key,
        answer,
      }));
    },
    async completeQuiz(userId, update: ProfileUpdate, list) {
      const base: ProfileRow = {
        display_name: null,
        relationship_status: null,
        tone: null,
        listen_time: null,
        notify_at: null,
      };
      const next = { ...base, ...profiles.get(userId), ...update };
      profiles.set(userId, next);
      people.set(userId, list);
      return next;
    },
  };
  return { repo, answers, profiles, people };
}
