import type { StoryGenerateRequested, StoryStatus } from '@eloria/shared';
import { SignJWT } from 'jose';
import { createApp, type AppDeps } from '../app';
import type { StoryEvents } from '../inngest/events';
import { createSupabaseVerifier } from '../middleware/auth';
import type { PushRepo } from '../repos/push-repo';
import type { ProfileRow, ProfileUpdate, QuizRepo } from '../repos/quiz-repo';
import type { StoryRepo } from '../repos/story-repo';

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

export function createFakeStoryRepo() {
  const desires: { id: string; userId: string; text: string; category: string }[] = [];
  const stories = new Map<
    string,
    {
      userId: string;
      desireId: string;
      status: StoryStatus;
      errorCode?: string;
      audioPath?: string;
    }
  >();
  /** 공용 리추얼 스토리(storyId → 무료 여부, 음성 경로) */
  const library = new Map<string, { isFree: boolean; audioPath: string | null }>();
  let seq = 0;
  const uuid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`;

  const repo: StoryRepo = {
    async createManifest(userId, { text, category }) {
      const desireId = uuid();
      const storyId = uuid();
      desires.push({ id: desireId, userId, text, category });
      stories.set(storyId, { userId, desireId, status: 'queued' });
      return { desireId, storyId };
    },
    async markFailed(storyId, errorCode) {
      const story = stories.get(storyId);
      if (story) Object.assign(story, { status: 'failed', errorCode });
    },
    async findOwnedStatus(userId, storyId) {
      const story = stories.get(storyId);
      return story && story.userId === userId
        ? { status: story.status, errorCode: story.errorCode ?? null }
        : null;
    },
    async deleteStory(_userId, storyId) {
      stories.delete(storyId);
    },
    async findMedia(userId, storyId) {
      const story = stories.get(storyId);
      if (story && story.userId === userId) {
        return {
          access: 'owner',
          isFree: false,
          audioPath: story.audioPath ?? null,
          coverPath: null,
        };
      }
      const item = library.get(storyId);
      return item
        ? { access: 'library', isFree: item.isFree, audioPath: item.audioPath, coverPath: null }
        : null;
    },
    async signMedia({ audio, cover }) {
      return {
        audioUrl: `https://signed.test/${audio}`,
        coverUrl: cover ? `https://signed.test/${cover}` : null,
      };
    },
  };
  return { repo, desires, stories, library };
}

export function createFakeStoryEvents(opts: { fail?: boolean } = {}) {
  const sent: StoryGenerateRequested[] = [];
  const events: StoryEvents = {
    async requestGeneration(data) {
      if (opts.fail) throw new Error('inngest unavailable');
      sent.push(data);
    },
  };
  return { events, sent };
}

export function createFakePushRepo() {
  const tokens = new Map<string, { userId: string; platform: string }>();
  const repo: PushRepo = {
    async upsertToken(userId, { token, platform }) {
      tokens.set(token, { userId, platform });
    },
    async listTokens(userId) {
      return [...tokens.entries()].filter(([, v]) => v.userId === userId).map(([t]) => t);
    },
    async deleteTokens(list) {
      list.forEach((t) => tokens.delete(t));
    },
  };
  return { repo, tokens };
}

/** 테스트용 앱. 필요한 의존성만 바꿔 끼운다. */
export function createTestApp(overrides: Partial<AppDeps> = {}) {
  return createApp({
    verifyToken,
    quizRepo: createFakeQuizRepo().repo,
    storyRepo: createFakeStoryRepo().repo,
    storyEvents: createFakeStoryEvents().events,
    pushRepo: createFakePushRepo().repo,
    ...overrides,
  });
}
