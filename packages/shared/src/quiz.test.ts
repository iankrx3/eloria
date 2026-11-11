import { describe, expect, it } from 'vitest';
import { quizAnswerRequestSchema } from './api/quiz';
import { LIMITS, resolveLimits } from './config/limits';
import {
  QUIZ_QUESTIONS,
  collectQuizAnswers,
  firstUnansweredStep,
  isQuestionActive,
  nextQuizStep,
  peopleFromQuizAnswers,
  profileFromQuizAnswers,
  quizQuestionKeySchema,
} from './quiz';

describe('QUIZ_QUESTIONS', () => {
  it('Figma 퀴즈 v2대로 13문항이고 키가 겹치지 않는다', () => {
    expect(QUIZ_QUESTIONS).toHaveLength(13);
    expect(new Set(QUIZ_QUESTIONS.map((q) => q.key)).size).toBe(13);
  });

  it('없는 문항 키(이전 퀴즈 포함)는 거부한다', () => {
    expect(quizQuestionKeySchema.safeParse('desire').success).toBe(true);
    expect(quizQuestionKeySchema.safeParse('tone').success).toBe(false);
  });
});

describe('quizAnswerRequestSchema', () => {
  const ok = (questionKey: string, answer: unknown) =>
    quizAnswerRequestSchema.safeParse({ questionKey, answer }).success;

  it('문항별 형식에 맞는 답만 받는다', () => {
    expect(ok('name', '서아')).toBe(true);
    expect(ok('name', '   ')).toBe(false);
    expect(ok('name', 'x'.repeat(21))).toBe(false);
    expect(ok('age', 27)).toBe(true);
    expect(ok('age', 13)).toBe(false);
    expect(ok('age', 27.5)).toBe(false);
    expect(ok('gender', 'undisclosed')).toBe(true);
    expect(ok('relationship_status', 'engaged')).toBe(false);
    expect(ok('love_desired', null)).toBe(true);
    expect(ok('love_desired', '편안한 사람')).toBe(true);
    expect(ok('love_desired', '')).toBe(false);
    expect(ok('dream_home', ['jeju_sea', 'night_view', 'han_river_view'])).toBe(true);
    expect(ok('dream_home', ['jeju_sea', 'night_view', 'han_river_view', 'forest_garden'])).toBe(
      false,
    );
    expect(ok('dream_home', ['jeju_sea', 'jeju_sea'])).toBe(false);
    expect(ok('people', [])).toBe(false);
    expect(ok('people', [{ name: '엄마', relation: 'family' }])).toBe(true);
    expect(ok('people', [{ name: '민준', relation: 'boss' }])).toBe(false);
  });
});

describe('조건부 문항', () => {
  it('사랑을 건너뛰면 특정한 사람 문항을, 사람이 없으면 이름 문항을 건너뛴다', () => {
    expect(isQuestionActive('has_person', { love_desired: null })).toBe(false);
    expect(isQuestionActive('has_person', { love_desired: '다정한 사람' })).toBe(true);
    expect(isQuestionActive('person_name', { love_desired: '다정한 사람', has_person: 'no' })).toBe(
      false,
    );
    // 8번(love_desired)을 건너뛰면 다음은 11번(people)
    expect(nextQuizStep(8, { love_desired: null })).toBe(11);
    expect(nextQuizStep(9, { love_desired: 'a', has_person: 'no' })).toBe(11);
    expect(nextQuizStep(13, {})).toBeNull();
  });
});

describe('collectQuizAnswers / firstUnansweredStep', () => {
  it('형식이 맞는 답만 모으고 첫 미응답 문항을 찾는다', () => {
    const answers = collectQuizAnswers([
      { question_key: 'name', answer: '서아' },
      { question_key: 'age', answer: 27 },
      { question_key: 'gender', answer: 'not-an-option' },
      { question_key: 'tone', answer: 'calm' },
    ]);
    expect(answers).toEqual({ name: '서아', age: 27 });
    expect(firstUnansweredStep(answers)).toBe(3);
  });

  it('건너뛴 조건부 문항은 미응답으로 보지 않는다', () => {
    const all = {
      name: 'a',
      age: 30,
      gender: 'female',
      desire: 'b',
      desire_why: 'c',
      desire_blocker: 'd',
      relationship_status: 'single',
      love_desired: null,
      people: [{ name: '엄마', relation: 'family' }],
      dream_home: ['jeju_sea'],
      dream_days: 'e',
    } as const;
    expect(
      firstUnansweredStep(
        collectQuizAnswers(
          Object.entries(all).map(([question_key, answer]) => ({ question_key, answer })),
        ),
      ),
    ).toBeNull();
  });
});

describe('profileFromQuizAnswers / peopleFromQuizAnswers', () => {
  it('프로필 컬럼만 옮긴다', () => {
    expect(
      profileFromQuizAnswers({ name: '서아', age: 27, relationship_status: 'dating' }),
    ).toEqual({ display_name: '서아', relationship_status: 'dating' });
  });

  it('마음에 둔 사람은 연인으로 앞에 넣고 한도를 넘기지 않는다', () => {
    const people = peopleFromQuizAnswers({
      love_desired: '다정한 사람',
      has_person: 'yes',
      person_name: '민준',
      people: [1, 2, 3, 4, 5].map((n) => ({ name: `friend${n}`, relation: 'friend' as const })),
    });
    expect(people).toHaveLength(5);
    expect(people[0]).toEqual({ name: '민준', relation: 'partner' });
    expect(peopleFromQuizAnswers({ love_desired: null, person_name: '민준' })).toEqual([]);
  });
});

describe('resolveLimits', () => {
  it('유효한 숫자만 기본값을 덮어쓴다', () => {
    const limits = resolveLimits({
      STORY_TARGET_CHARS: 2000,
      FREE_STORIES_TOTAL: 'x',
      MAX_CONCURRENT_TTS: -1,
    });
    expect(limits.STORY_TARGET_CHARS).toBe(2000);
    expect(limits.FREE_STORIES_TOTAL).toBe(LIMITS.FREE_STORIES_TOTAL);
    expect(limits.MAX_CONCURRENT_TTS).toBe(LIMITS.MAX_CONCURRENT_TTS);
  });
});
