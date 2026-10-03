import { QUIZ_TOTAL, nextAfterQuizStep, parseQuizStep } from './flow';

describe('onboarding flow', () => {
  it('퀴즈는 PRD대로 12문항이다', () => {
    expect(QUIZ_TOTAL).toBe(12);
  });

  it('잘못된 단계 값은 1로 본다', () => {
    expect(parseQuizStep('3')).toBe(3);
    expect(parseQuizStep(['5'])).toBe(5);
    expect(parseQuizStep('0')).toBe(1);
    expect(parseQuizStep('13')).toBe(1);
    expect(parseQuizStep('abc')).toBe(1);
    expect(parseQuizStep(undefined)).toBe(1);
  });

  it('마지막 문항 다음은 첫 꿈 입력이다', () => {
    expect(nextAfterQuizStep(1)).toBe('/quiz/2');
    expect(nextAfterQuizStep(12)).toBe('/first-manifest');
  });
});
