/**
 * 페이월 미리보기 가격(Figma H09 예시값). 실제 상품·가격은 RevenueCat 연결(M5)에서 스토어 값으로 바꾼다.
 * 연간 가격은 열린 질문 Q-01(ROADMAP)이라 여기서만 고친다.
 */
export const PAYWALL_PREVIEW = {
  yearlyWon: 59000,
  monthlyWon: 9900,
  /** 닫기(×)를 늦게 보여 주는 시간(Figma H09 노트: 3초, 소프트 페이월) */
  closeDelayMs: 3000,
} as const;

export const won = (n: number) => n.toLocaleString('ko-KR');
