import { z } from 'zod';

/**
 * Intro Quiz 문항 구조(docs/PRD.md 5절). 화면에 보이는 문구는 앱의 i18n/ko.ts에
 * `quiz.<key>`로 두고, 여기에는 키·입력 방식·선택지 키만 둔다.
 */
export type QuizQuestion =
  | { key: string; kind: 'text'; maxLength: number; optional?: boolean }
  | { key: string; kind: 'single'; options: readonly string[] }
  | { key: string; kind: 'multi'; options: readonly string[]; max?: number }
  | { key: string; kind: 'people'; optional: true }
  | { key: string; kind: 'voice' }
  | { key: string; kind: 'notification' };

export const QUIZ_QUESTIONS = [
  { key: 'name', kind: 'text', maxLength: 20 },
  {
    key: 'desired_life',
    kind: 'multi',
    options: ['wealth', 'love', 'career', 'health', 'confidence'],
  },
  {
    key: 'relationship_status',
    kind: 'single',
    options: ['single', 'dating', 'complicated', 'married'],
  },
  { key: 'people', kind: 'people', optional: true },
  { key: 'day_start', kind: 'single', options: ['seoul_city', 'seaside', 'abroad', 'nature'] },
  { key: 'one_year_change', kind: 'text', maxLength: 200 },
  // 톤 조절에만 쓰고 건강 정보로 저장·해석하지 않는다(PRD 5절).
  {
    key: 'recent_feeling',
    kind: 'single',
    options: ['anxious', 'tired', 'excited', 'impatient', 'calm'],
  },
  {
    key: 'future_self',
    kind: 'multi',
    options: ['relaxed', 'confident', 'kind', 'free', 'successful'],
    max: 3,
  },
  { key: 'tone', kind: 'single', options: ['calm', 'excited', 'powerful'] },
  { key: 'listen_time', kind: 'single', options: ['morning', 'commute', 'night'] },
  { key: 'voice', kind: 'voice' },
  { key: 'notification', kind: 'notification' },
] as const satisfies readonly QuizQuestion[];

export type QuizQuestionKey = (typeof QUIZ_QUESTIONS)[number]['key'];

export const quizQuestionKeySchema = z.enum(
  QUIZ_QUESTIONS.map((q) => q.key) as [QuizQuestionKey, ...QuizQuestionKey[]],
);
