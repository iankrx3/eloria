import { describe, expect, it } from 'vitest';
import { LIMITS, resolveLimits } from './config/limits';
import { QUIZ_QUESTIONS, quizQuestionKeySchema } from './quiz';

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
