import { describe, expect, it } from 'vitest';
import { quizAnswerRequestSchema } from './api/quiz';
import { LIMITS, resolveLimits } from './config/limits';
import {
  QUIZ_QUESTIONS,
  collectQuizAnswers,
  firstUnansweredStep,
  profileFromQuizAnswers,
  quizQuestionKeySchema,
} from './quiz';

describe('QUIZ_QUESTIONS', () => {
  it('PRD 5절대로 12문항이고 키가 겹치지 않는다', () => {
    expect(QUIZ_QUESTIONS).toHaveLength(12);
    expect(new Set(QUIZ_QUESTIONS.map((q) => q.key)).size).toBe(12);
  });

  it('없는 문항 키는 거부한다', () => {
    expect(quizQuestionKeySchema.safeParse('tone').success).toBe(true);
    expect(quizQuestionKeySchema.safeParse('unknown').success).toBe(false);
  });
});

describe('quizAnswerRequestSchema', () => {
  const ok = (questionKey: string, answer: unknown) =>
    quizAnswerRequestSchema.safeParse({ questionKey, answer }).success;

  it('문항별 형식에 맞는 답만 받는다', () => {
    expect(ok('name', '서아')).toBe(true);
    expect(ok('name', '   ')).toBe(false);
    expect(ok('name', 'x'.repeat(21))).toBe(false);
    expect(ok('relationship_status', 'dating')).toBe(true);
    expect(ok('relationship_status', 'engaged')).toBe(false);
    expect(ok('desired_life', ['wealth', 'love'])).toBe(true);
    expect(ok('desired_life', [])).toBe(false);
    expect(ok('desired_life', ['love', 'love'])).toBe(false);
    expect(ok('future_self', ['kind', 'free', 'relaxed'])).toBe(true);
    expect(ok('future_self', ['kind', 'free', 'relaxed', 'confident'])).toBe(false);
    expect(ok('people', [])).toBe(true);
    expect(ok('people', [{ name: '민준', relation: 'partner' }])).toBe(true);
    expect(ok('people', [{ name: '민준', relation: 'boss' }])).toBe(false);
    expect(ok('voice', 'voice_b')).toBe(true);
    expect(ok('notification', { granted: false })).toBe(true);
    expect(ok('notification', true)).toBe(false);
  });
});

describe('collectQuizAnswers / firstUnansweredStep', () => {
  it('형식이 맞는 답만 모으고 첫 미응답 문항을 찾는다', () => {
    const answers = collectQuizAnswers([
      { question_key: 'name', answer: '서아' },
      { question_key: 'desired_life', answer: ['love'] },
      { question_key: 'relationship_status', answer: 'not-an-option' },
      { question_key: 'unknown', answer: 1 },
    ]);
    expect(answers).toEqual({ name: '서아', desired_life: ['love'] });
    expect(firstUnansweredStep(answers)).toBe(3);
  });

  it('모두 답했으면 null', () => {
    const all = {
      name: 'a',
      desired_life: ['love'],
      relationship_status: 'single',
      people: [],
      day_start: 'seaside',
      one_year_change: 'b',
      recent_feeling: 'calm',
      future_self: ['kind'],
      tone: 'calm',
      listen_time: 'night',
      voice: 'voice_a',
      notification: { granted: true },
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

describe('profileFromQuizAnswers', () => {
  it('프로필 컬럼만 옮기고 듣는 시간으로 알림 기본값을 정한다', () => {
    expect(
      profileFromQuizAnswers({
        name: '서아',
        tone: 'excited',
        listen_time: 'night',
        recent_feeling: 'anxious',
      }),
    ).toEqual({ display_name: '서아', tone: 'excited', listen_time: 'night', notify_at: '22:30' });
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
