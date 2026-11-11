import { z } from 'zod';

/**
 * Intro Quiz v2(Figma ARIN 02 Quiz, docs/PRD.md 5절, DECISIONS D-39).
 * 화면 문구는 앱의 i18n/ko.ts에 `quiz.questions.<key>`로 두고, 여기에는 키·입력 방식·선택지 키·검증 규칙만 둔다.
 */
export const GENDER = ['female', 'male', 'other', 'undisclosed'] as const;
export const RELATIONSHIP_STATUS = ['single', 'dating', 'complicated', 'married'] as const;
export const YES_NO = ['yes', 'no'] as const;
/** 상상 속 아침 풍경(최대 3개) */
export const DREAM_HOME = [
  'han_river_view',
  'night_view',
  'jeju_sea',
  'forest_garden',
  'sunset_terrace',
  'white_curtains',
  'foreign_street',
  'snowy_mountain',
  'current_window',
] as const;
export const PERSON_RELATION = ['partner', 'family', 'friend', 'pet', 'other'] as const;

export const NAME_MAX = 20;
export const QUIZ_TEXT_MAX = 200;
/** 만 14세 미만은 법정대리인 동의 대상이라 받지 않는다(Figma Q02 노트). */
export const AGE_MIN = 14;
export const AGE_MAX = 99;
export const PEOPLE_MAX = 5;
export const DREAM_HOME_MAX = 3;

/** 섹션: 화면 위쪽 영문 라벨과 "n / m" */
export const QUIZ_SECTIONS = [
  'basics',
  'manifestation',
  'relationships',
  'people',
  'dream',
] as const;
export type QuizSection = (typeof QUIZ_SECTIONS)[number];

export type QuizQuestion =
  | { key: string; section: QuizSection; kind: 'text'; maxLength: number; multiline?: boolean }
  | { key: string; section: QuizSection; kind: 'number'; min: number; max: number }
  | { key: string; section: QuizSection; kind: 'single'; options: readonly string[] }
  | { key: string; section: QuizSection; kind: 'multi'; options: readonly string[]; max: number }
  | { key: string; section: QuizSection; kind: 'people' }
  /** 건너뛸 수 있는 자유 서술. 건너뛰면 답이 null */
  | { key: string; section: QuizSection; kind: 'skippable-text'; maxLength: number };

export const QUIZ_QUESTIONS = [
  { key: 'name', section: 'basics', kind: 'text', maxLength: NAME_MAX },
  { key: 'age', section: 'basics', kind: 'number', min: AGE_MIN, max: AGE_MAX },
  { key: 'gender', section: 'basics', kind: 'single', options: GENDER },
  // 첫 이야기는 이 답으로 만든다(퀴즈 직후 백그라운드 생성).
  {
    key: 'desire',
    section: 'manifestation',
    kind: 'text',
    maxLength: QUIZ_TEXT_MAX,
    multiline: true,
  },
  {
    key: 'desire_why',
    section: 'manifestation',
    kind: 'text',
    maxLength: QUIZ_TEXT_MAX,
    multiline: true,
  },
  // 확언 생성에만 쓰고 스토리에 직접 드러내지 않는다.
  {
    key: 'desire_blocker',
    section: 'manifestation',
    kind: 'text',
    maxLength: QUIZ_TEXT_MAX,
    multiline: true,
  },
  {
    key: 'relationship_status',
    section: 'relationships',
    kind: 'single',
    options: RELATIONSHIP_STATUS,
  },
  {
    key: 'love_desired',
    section: 'relationships',
    kind: 'skippable-text',
    maxLength: QUIZ_TEXT_MAX,
  },
  { key: 'has_person', section: 'relationships', kind: 'single', options: YES_NO },
  { key: 'person_name', section: 'relationships', kind: 'text', maxLength: NAME_MAX },
  { key: 'people', section: 'people', kind: 'people' },
  { key: 'dream_home', section: 'dream', kind: 'multi', options: DREAM_HOME, max: DREAM_HOME_MAX },
  { key: 'dream_days', section: 'dream', kind: 'text', maxLength: QUIZ_TEXT_MAX, multiline: true },
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

const text = (max: number) => z.string().trim().min(1).max(max);

export const personSchema = z.object({
  name: z.string().trim().min(1).max(NAME_MAX),
  relation: z.enum(PERSON_RELATION),
});
export type Person = z.infer<typeof personSchema>;

/** 문항별 답변 형식. 서버(POST /v1/quiz/answers)와 앱이 같은 규칙을 쓴다. */
export const quizAnswerSchemas = {
  name: text(NAME_MAX),
  age: z.number().int().min(AGE_MIN).max(AGE_MAX),
  gender: z.enum(GENDER),
  desire: text(QUIZ_TEXT_MAX),
  desire_why: text(QUIZ_TEXT_MAX),
  desire_blocker: text(QUIZ_TEXT_MAX),
  relationship_status: z.enum(RELATIONSHIP_STATUS),
  love_desired: text(QUIZ_TEXT_MAX).nullable(),
  has_person: z.enum(YES_NO),
  person_name: text(NAME_MAX),
  people: z.array(personSchema).min(1).max(PEOPLE_MAX),
  dream_home: multi(DREAM_HOME, DREAM_HOME_MAX),
  dream_days: text(QUIZ_TEXT_MAX),
} satisfies Record<QuizQuestionKey, z.ZodType>;

export type QuizAnswers = { [K in QuizQuestionKey]: z.infer<(typeof quizAnswerSchemas)[K]> };

export function parseQuizAnswer<K extends QuizQuestionKey>(
  key: K,
  answer: unknown,
): QuizAnswers[K] {
  return quizAnswerSchemas[key].parse(answer) as QuizAnswers[K];
}

/** DB에서 읽은 답변 행들을 키별 객체로 모은다. 형식이 맞지 않는 답변(이전 퀴즈 포함)은 버린다. */
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

/**
 * 앞선 답에 따라 보여 줄지 정한다(Figma Q08~Q10 노트).
 * "지금은 사랑이 우선이 아니에요"(love_desired = null)면 특정한 사람 문항을 건너뛰고,
 * 특정한 사람이 없으면 이름 문항을 건너뛴다.
 */
export function isQuestionActive(key: QuizQuestionKey, answers: Partial<QuizAnswers>): boolean {
  switch (key) {
    case 'has_person':
      return typeof answers.love_desired === 'string';
    case 'person_name':
      return typeof answers.love_desired === 'string' && answers.has_person === 'yes';
    default:
      return true;
  }
}

/** 지금 답에서 보여 줄 문항 키 목록 */
export function activeQuestionKeys(answers: Partial<QuizAnswers>): QuizQuestionKey[] {
  return QUIZ_QUESTIONS.map((q) => q.key).filter((k) => isQuestionActive(k, answers));
}

/** 아직 답하지 않은 첫 문항의 1부터 시작하는 번호(QUIZ_QUESTIONS 기준). 모두 답했으면 null. */
export function firstUnansweredStep(answers: Partial<QuizAnswers>): number | null {
  const index = QUIZ_QUESTIONS.findIndex(
    (q) => isQuestionActive(q.key, answers) && answers[q.key] === undefined,
  );
  return index === -1 ? null : index + 1;
}

/** step(1부터) 다음에 보여 줄 문항 번호. 마지막이면 null */
export function nextQuizStep(step: number, answers: Partial<QuizAnswers>): number | null {
  for (let i = step; i < QUIZ_QUESTIONS.length; i++) {
    if (isQuestionActive(QUIZ_QUESTIONS[i]!.key, answers)) return i + 1;
  }
  return null;
}

/** 퀴즈 답변을 profiles 컬럼으로 옮긴다(POST /v1/quiz/complete). 나이·성별 등은 quiz_answers에 남는다. */
export function profileFromQuizAnswers(answers: Partial<QuizAnswers>) {
  return {
    ...(answers.name !== undefined && { display_name: answers.name }),
    ...(answers.relationship_status !== undefined && {
      relationship_status: answers.relationship_status,
    }),
  };
}

/**
 * 퀴즈의 people 목록. "마음에 둔 사람"의 이름은 연인 자리로 넣는다(같은 이름이 이미 있으면 그대로 둔다).
 * people 테이블 한도(PEOPLE_MAX)를 넘지 않게 자른다.
 */
export function peopleFromQuizAnswers(answers: Partial<QuizAnswers>): Person[] {
  const people = [...(answers.people ?? [])];
  const crush = isQuestionActive('person_name', answers) ? answers.person_name : undefined;
  if (crush && !people.some((p) => p.name === crush)) {
    people.unshift({ name: crush, relation: 'partner' });
  }
  return people.slice(0, PEOPLE_MAX);
}

/**
 * 이전 퀴즈(v1)의 선택지. 새 퀴즈에는 없지만 프롬프트 평가 세트(packages/prompts/eval)와
 * profiles 컬럼 제약(tone, listen_time)이 아직 쓴다.
 */
export const DESIRED_LIFE = ['wealth', 'love', 'career', 'health', 'confidence'] as const;
export const DAY_START = ['seoul_city', 'seaside', 'abroad', 'nature'] as const;
export const RECENT_FEELING = ['anxious', 'tired', 'excited', 'impatient', 'calm'] as const;
export const FUTURE_SELF = ['relaxed', 'confident', 'kind', 'free', 'successful'] as const;
export const TONE = ['calm', 'excited', 'powerful'] as const;
export const LISTEN_TIME = ['morning', 'commute', 'night'] as const;
export const ONE_YEAR_CHANGE_MAX = 200;
export const FUTURE_SELF_MAX = 3;
