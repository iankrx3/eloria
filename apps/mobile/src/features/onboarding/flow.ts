import { QUIZ_QUESTIONS } from '@eloria/shared';
import type { Href } from 'expo-router';

/**
 * 온보딩 순서(PRD 6절, DECISIONS D-08: 계정 연결은 페이월 직전).
 * 퀴즈 → 첫 꿈 → (생성 진행·첫 스토리, M2) → 계정 연결 → 페이월 → 홈 탭
 */
export const QUIZ_TOTAL = QUIZ_QUESTIONS.length;

// 퀴즈 진입점은 이어하기 화면이다(답하지 않은 첫 문항으로 보낸다).
export const ONBOARDING_START: Href = '/quiz';

/** 퀴즈 단계 문자열을 1~QUIZ_TOTAL 사이 정수로 바꾼다. 잘못된 값은 1로 본다. */
export function parseQuizStep(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(n) && n >= 1 && n <= QUIZ_TOTAL ? n : 1;
}

export function nextAfterQuizStep(step: number): Href {
  return step < QUIZ_TOTAL ? `/quiz/${step + 1}` : '/first-manifest';
}
