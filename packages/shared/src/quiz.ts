import { z } from 'zod';
import { DEFAULT_NOTIFY_AT } from './config/defaults';

/**
 * Intro Quiz 문항 구조와 답변 형식(docs/PRD.md 5절). 화면 문구는 앱의 i18n/ko.ts에
 * `quiz.<key>`로 두고, 여기에는 키·입력 방식·선택지 키·검증 규칙만 둔다.
 */
export const DESIRED_LIFE = ['wealth', 'love', 'career', 'health', 'confidence'] as const;
export const RELATIONSHIP_STATUS = ['single', 'dating', 'complicated', 'married'] as const;
export const DAY_START = ['seoul_city', 'seaside', 'abroad', 'nature'] as const;
export const RECENT_FEELING = ['anxious', 'tired', 'excited', 'impatient', 'calm'] as const;
export const FUTURE_SELF = ['relaxed', 'confident', 'kind', 'free', 'successful'] as const;
export const TONE = ['calm', 'excited', 'powerful'] as const;
export const LISTEN_TIME = ['morning', 'commute', 'night'] as const;
export const PERSON_RELATION = ['partner', 'family', 'friend', 'pet', 'other'] as const;
/** 보이스 3종 자리. 실제 보이스는 M2 블라인드 청취 후 voices 테이블로 확정한다(Q-08). */
export const VOICE_KEYS = ['voice_a', 'voice_b', 'voice_c'] as const;

export const NAME_MAX = 20;
export const ONE_YEAR_CHANGE_MAX = 200;
export const PEOPLE_MAX = 5;
export const FUTURE_SELF_MAX = 3;

export type QuizQuestion =
  | { key: string; kind: 'text'; maxLength: number; optional?: boolean }
  | { key: string; kind: 'single'; options: readonly string[] }
  | { key: string; kind: 'multi'; options: readonly string[]; max?: number }
  | { key: string; kind: 'people'; optional: true }
  | { key: string; kind: 'voice'; options: readonly string[] }
  | { key: string; kind: 'notification' };

export const QUIZ_QUESTIONS = [
  { key: 'name', kind: 'text', maxLength: NAME_MAX },
  { key: 'desired_life', kind: 'multi', options: DESIRED_LIFE },
  { key: 'relationship_status', kind: 'single', options: RELATIONSHIP_STATUS },
  { key: 'people', kind: 'people', optional: true },
  { key: 'day_start', kind: 'single', options: DAY_START },
  { key: 'one_year_change', kind: 'text', maxLength: ONE_YEAR_CHANGE_MAX },
  // 톤 조절에만 쓰고 건강 정보로 저장·해석하지 않는다(PRD 5절).
  { key: 'recent_feeling', kind: 'single', options: RECENT_FEELING },
  { key: 'future_self', kind: 'multi', options: FUTURE_SELF, max: FUTURE_SELF_MAX },
  { key: 'tone', kind: 'single', options: TONE },
  { key: 'listen_time', kind: 'single', options: LISTEN_TIME },
  { key: 'voice', kind: 'voice', options: VOICE_KEYS },
  { key: 'notification', kind: 'notification' },
] as const satisfies readonly QuizQuestion[];

export type QuizQuestionKey = (typeof QUIZ_QUESTIONS)[number]['key'];

export const quizQuestionKeySchema = z.enum(
  QUIZ_QUESTIONS.map((q) => q.key) as [QuizQuestionKey, ...QuizQuestionKey[]],
);

function multi<const T extends readonly [string, ...string[]]>(options: T, max = options.length) {
  return z
    .array(z.enum(options))
    .min(1)
    .max(max)
    .refine((v) => new Set(v).size === v.length, '같은 선택지를 두 번 고를 수 없습니다.');
}

export const personSchema = z.object({
  name: z.string().trim().min(1).max(NAME_MAX),
  relation: z.enum(PERSON_RELATION),
});
export type Person = z.infer<typeof personSchema>;

/** 문항별 답변 형식. 서버(POST /v1/quiz/answers)와 앱이 같은 규칙을 쓴다. */
export const quizAnswerSchemas = {
  name: z.string().trim().min(1).max(NAME_MAX),
  desired_life: multi(DESIRED_LIFE),
  relationship_status: z.enum(RELATIONSHIP_STATUS),
  people: z.array(personSchema).max(PEOPLE_MAX),
  day_start: z.enum(DAY_START),
  one_year_change: z.string().trim().min(1).max(ONE_YEAR_CHANGE_MAX),
  recent_feeling: z.enum(RECENT_FEELING),
  future_self: multi(FUTURE_SELF, FUTURE_SELF_MAX),
  tone: z.enum(TONE),
  listen_time: z.enum(LISTEN_TIME),
  voice: z.enum(VOICE_KEYS),
  notification: z.object({ granted: z.boolean() }),
} satisfies Record<QuizQuestionKey, z.ZodType>;

export type QuizAnswers = { [K in QuizQuestionKey]: z.infer<(typeof quizAnswerSchemas)[K]> };

export function parseQuizAnswer<K extends QuizQuestionKey>(
  key: K,
  answer: unknown,
): QuizAnswers[K] {
  return quizAnswerSchemas[key].parse(answer) as QuizAnswers[K];
}

/** DB에서 읽은 답변 행들을 키별 객체로 모은다. 형식이 맞지 않는 답변은 버린다. */
export function collectQuizAnswers(
  rows: readonly { question_key: string; answer: unknown }[],
): Partial<QuizAnswers> {
  const result: Partial<Record<QuizQuestionKey, unknown>> = {};
  for (const row of rows) {
    const key = quizQuestionKeySchema.safeParse(row.question_key);
    if (!key.success) continue;
    const parsed = quizAnswerSchemas[key.data].safeParse(row.answer);
    if (parsed.success) result[key.data] = parsed.data;
  }
  return result as Partial<QuizAnswers>;
}

/** 아직 답하지 않은 첫 문항의 1부터 시작하는 번호. 모두 답했으면 null. */
export function firstUnansweredStep(answers: Partial<QuizAnswers>): number | null {
  const index = QUIZ_QUESTIONS.findIndex((q) => answers[q.key] === undefined);
  return index === -1 ? null : index + 1;
}

/**
 * 퀴즈 답변을 profiles 컬럼으로 옮긴다(POST /v1/quiz/complete).
 * 감정(recent_feeling)은 프로필에 저장하지 않는다(PRD 5절).
 */
export function profileFromQuizAnswers(answers: Partial<QuizAnswers>) {
  return {
    ...(answers.name !== undefined && { display_name: answers.name }),
    ...(answers.relationship_status !== undefined && {
      relationship_status: answers.relationship_status,
    }),
    ...(answers.tone !== undefined && { tone: answers.tone }),
    ...(answers.listen_time !== undefined && {
      listen_time: answers.listen_time,
      notify_at: DEFAULT_NOTIFY_AT[answers.listen_time],
    }),
  };
}
