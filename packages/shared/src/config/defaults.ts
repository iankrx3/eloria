/**
 * 설계 문서에 값이 없는 제품 기본값. 바꾸기 쉽게 상수로 둔다(CLAUDE.md "모르면").
 */

/** 퀴즈 "주로 언제 듣고 싶나요?" 답에 따른 알림 시간 기본값(로컬 시각, Q-09). */
export const DEFAULT_NOTIFY_AT = {
  morning: '07:30',
  commute: '08:30',
  night: '22:30',
} as const satisfies Record<'morning' | 'commute' | 'night', `${number}:${number}`>;
