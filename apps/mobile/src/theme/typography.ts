/**
 * 글자 스타일(Figma 01 Brand · Type Scale). 색은 화면마다 달라서 따로 붙인다.
 * 사용자 지정 글꼴은 굵기를 fontWeight가 아니라 글꼴 이름(font-*-semibold)으로 고른다.
 */
export const type = {
  /** KR/H1 · MaruBuri SemiBold 30/140% */
  h1: 'font-serif-semibold text-[30px] leading-[42px] tracking-[-0.3px]',
  /** KR/H2 · MaruBuri SemiBold 22/140% */
  h2: 'font-serif-semibold text-[22px] leading-[31px] tracking-[-0.22px]',
  /** KR/Story Subtitle · MaruBuri Regular 28/145% */
  subtitle: 'font-serif text-[28px] leading-[41px] tracking-[-0.28px]',
  /** KR/Body · Pretendard Regular 16/150% */
  body: 'font-sans text-[16px] leading-[24px] tracking-[-0.16px]',
  /** KR/Body Medium · Pretendard Medium 16/150% */
  bodyMedium: 'font-sans-medium text-[16px] leading-[24px] tracking-[-0.16px]',
  /** 14px 본문(알림 카드 등) */
  small: 'font-sans text-[14px] leading-[21px] tracking-[-0.14px]',
  /** KR/Caption · Pretendard Regular 12/140% */
  caption: 'font-sans text-[12px] leading-[17px]',
  /** EN/Label · Cormorant Garamond SemiBold 12, 자간 넓게(대문자) */
  label: 'font-display-semibold text-[12px] leading-[14px] tracking-[3px]',
  /** 작은 EN 라벨(NOW PLAYING 등) */
  labelSmall: 'font-display-semibold text-[11px] leading-[13px] tracking-[2.75px]',
  /** EN 숫자(통계·카운트다운) · Cormorant Garamond Medium */
  number: 'font-display text-[30px] leading-[36px]',
} as const;
