import {
  nextQuizStep,
  QUIZ_QUESTIONS,
  type QuizAnswers,
  type QuizQuestionKey,
  type QuizSection,
} from '@eloria/shared';
import type { Href } from 'expo-router';

/**
 * 온보딩 순서(Figma ARIN 02 Quiz, DECISIONS D-39).
 * 퀴즈 13문항(+ 전환 화면) → 시네마틱 4장(뒤에서 첫 이야기 생성) → 로그인 → 홈(첫 진입 시 페이월)
 */
export const QUIZ_TOTAL = QUIZ_QUESTIONS.length;

// 퀴즈 진입점은 이어하기 화면이다(답하지 않은 첫 문항으로 보낸다).
export const ONBOARDING_START: Href = '/quiz';
export const CINEMATIC: Href = '/cinematic';
export const TRANSITION: Href = '/quiz/transition';

type Item = QuizQuestionKey | 'transition';

/** 화면 순서(전환 화면 포함). 진행 바와 섹션 "n / m"을 이 목록으로 센다. */
const ITEMS: Item[] = QUIZ_QUESTIONS.flatMap((q) =>
  q.key === 'dream_home' ? (['transition', q.key] as Item[]) : [q.key as Item],
);

const SECTION_OF = new Map<Item, QuizSection>([
  ...QUIZ_QUESTIONS.map((q) => [q.key, q.section] as [Item, QuizSection]),
  ['transition', 'dream'],
]);

/** 퀴즈 단계 문자열을 1~QUIZ_TOTAL 사이 정수로 바꾼다. 잘못된 값은 1로 본다. */
export function parseQuizStep(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(n) && n >= 1 && n <= QUIZ_TOTAL ? n : 1;
}

/** step 문항에 답한 뒤 갈 곳. 조건부 문항은 건너뛰고, 꿈꾸는 삶 섹션 앞에서는 전환 화면을 보여 준다. */
export function nextAfterQuizStep(step: number, answers: Partial<QuizAnswers>): Href {
  const next = nextQuizStep(step, answers);
  if (next === null) return CINEMATIC;
  if (QUIZ_QUESTIONS[next - 1]!.key === 'dream_home') return TRANSITION;
  return `/quiz/${next}`;
}

export function stepOf(key: QuizQuestionKey): number {
  return QUIZ_QUESTIONS.findIndex((q) => q.key === key) + 1;
}

/** 진행 바 비율(0~1)과 섹션 안 위치 */
export function quizProgress(item: Item) {
  const index = ITEMS.indexOf(item);
  const section = SECTION_OF.get(item)!;
  const inSection = ITEMS.filter((i) => SECTION_OF.get(i) === section);
  return {
    fraction: (index + 1) / ITEMS.length,
    section,
    sectionIndex: inSection.indexOf(item) + 1,
    sectionTotal: inSection.length,
  };
}
