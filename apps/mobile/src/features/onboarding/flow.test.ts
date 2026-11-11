import { QUIZ_TOTAL, nextAfterQuizStep, parseQuizStep, quizProgress, stepOf } from './flow';

describe('onboarding flow', () => {
  it('퀴즈는 Figma v2대로 13문항이다', () => {
    expect(QUIZ_TOTAL).toBe(13);
  });

  it('잘못된 단계 값은 1로 본다', () => {
    expect(parseQuizStep('3')).toBe(3);
    expect(parseQuizStep(['5'])).toBe(5);
    expect(parseQuizStep('0')).toBe(1);
    expect(parseQuizStep('14')).toBe(1);
    expect(parseQuizStep('abc')).toBe(1);
    expect(parseQuizStep(undefined)).toBe(1);
  });

  it('조건부 문항을 건너뛰고, 꿈꾸는 삶 앞에는 전환 화면, 마지막 뒤에는 시네마틱', () => {
    expect(nextAfterQuizStep(1, {})).toBe('/quiz/2');
    expect(nextAfterQuizStep(stepOf('love_desired'), { love_desired: null })).toBe(
      `/quiz/${stepOf('people')}`,
    );
    expect(nextAfterQuizStep(stepOf('people'), {})).toBe('/quiz/transition');
    expect(nextAfterQuizStep(QUIZ_TOTAL, {})).toBe('/cinematic');
  });

  it('섹션 안 위치를 Figma와 같게 센다', () => {
    expect(quizProgress('name')).toMatchObject({
      section: 'basics',
      sectionIndex: 1,
      sectionTotal: 3,
    });
    expect(quizProgress('person_name')).toMatchObject({ sectionIndex: 4, sectionTotal: 4 });
    expect(quizProgress('transition')).toMatchObject({ section: 'dream', sectionIndex: 1 });
    expect(quizProgress('dream_days').fraction).toBe(1);
  });
});
