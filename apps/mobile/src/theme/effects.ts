import type { TextStyle, ViewStyle } from 'react-native';

/**
 * 그라디언트·그림자(Figma 01 Brand · Gradients). RN 0.86의 CSS 그라디언트(experimental_backgroundImage)와
 * boxShadow를 쓴다. NativeWind 클래스로는 표현할 수 없어 style로 넘긴다.
 */

/** Day · Dawn: 밝은 화면 배경(홈) */
export const dawnScreen: ViewStyle = {
  experimental_backgroundImage: 'linear-gradient(180deg, #F7E8EE 0%, #EEDFF2 45%, #DCE0F5 100%)',
};

/** 라이브러리·마이 배경(4단 그라디언트) */
export const dawnScreenLong: ViewStyle = {
  experimental_backgroundImage:
    'linear-gradient(180deg, #F7E8EE 0%, #EEDFF2 40%, #E4DDF4 75%, #DCE0F5 100%)',
};

/** 가로 Day · Dawn(알림 마크, 브랜드 카드) */
export const dawnHorizontal: ViewStyle = {
  experimental_backgroundImage: 'linear-gradient(90deg, #F6E6EA 0%, #E6D9F0 50%, #CCD6F2 100%)',
};

/** Night · Twilight(플레이어 등 어두운 면) */
export const twilight: ViewStyle = {
  experimental_backgroundImage: 'linear-gradient(90deg, #1F1A33 0%, #3E2A4F 100%)',
};

/** 퀴즈·시네마틱 사진 위 오버레이. tint = 가로 보라빛 필름(Figma 화면마다 0.14~0.28) */
export function photoOverlay(tint = 0.24): ViewStyle {
  return {
    experimental_backgroundImage: `linear-gradient(180deg, rgba(46,33,64,0.52) 0%, rgba(46,33,64,0) 46%, rgba(46,33,64,0) 70%, rgba(46,33,64,0.32) 100%), linear-gradient(90deg, rgba(94,68,88,${tint}) 0%, rgba(94,68,88,${tint}) 100%)`,
  };
}

/** 로그인(S01): 아래쪽을 더 어둡게 해 버튼·문구를 읽히게 한다 */
export const loginOverlay: ViewStyle = {
  experimental_backgroundImage:
    'linear-gradient(180deg, rgba(46,33,64,0.45) 0%, rgba(46,33,64,0) 32%, rgba(46,33,64,0.05) 50%, rgba(46,33,64,0.82) 100%), linear-gradient(90deg, rgba(94,68,88,0.18) 0%, rgba(94,68,88,0.18) 100%)',
};

/** 생성 진행(H04) */
export const progressOverlay: ViewStyle = {
  experimental_backgroundImage:
    'linear-gradient(180deg, rgba(46,33,64,0.4) 0%, rgba(46,33,64,0) 40%, rgba(46,33,64,0) 70%, rgba(46,33,64,0.45) 100%), linear-gradient(90deg, rgba(94,68,88,0.18) 0%, rgba(94,68,88,0.18) 100%)',
};

/** 플레이어(H07) */
export const playerOverlay: ViewStyle = {
  experimental_backgroundImage:
    'linear-gradient(180deg, rgba(31,26,51,0.55) 0%, rgba(31,26,51,0.1) 35%, rgba(31,26,51,0.35) 60%, rgba(31,26,51,0.85) 100%), linear-gradient(90deg, rgba(31,26,51,0.45) 0%, rgba(31,26,51,0.45) 100%)',
};

/** 사진 카드 아래쪽 어둡게(스토리·라이브러리 카드) */
export const cardOverlay: ViewStyle = {
  experimental_backgroundImage:
    'linear-gradient(180deg, rgba(46,33,64,0) 35%, rgba(46,33,64,0.78) 100%)',
};

/** 홈 스토리 카드 */
export const storyCardOverlay: ViewStyle = {
  experimental_backgroundImage:
    'linear-gradient(180deg, rgba(31,26,51,0) 0%, rgba(31,26,51,0) 45%, rgba(31,26,51,0.72) 100%)',
};

/** 페이월 상단 사진이 배경색으로 녹아드는 그라디언트 */
export const paywallPhotoFade: ViewStyle = {
  experimental_backgroundImage:
    'linear-gradient(180deg, rgba(46,33,64,0.3) 0%, rgba(46,33,64,0) 30%, rgba(239,227,241,0.55) 75%, #EFE3F1 100%)',
};
export const paywallScreen: ViewStyle = {
  experimental_backgroundImage: 'linear-gradient(180deg, #EFE3F1 0%, #F7F2FA 100%)',
};

/** 멤버십 카드(P01) */
export const membershipCard: ViewStyle = {
  experimental_backgroundImage: 'linear-gradient(154deg, #714D7F 14%, #9B6A93 54%, #C79AA8 86%)',
  boxShadow: '0px 12px 28px 0px rgba(113,77,127,0.3)',
};

/** 아바타·사람 아이콘 */
export const avatarGradient: ViewStyle = {
  experimental_backgroundImage: 'linear-gradient(118deg, #F6C9DA 14%, #D9CFF0 86%)',
};
export const personGradients: ViewStyle[] = [
  { experimental_backgroundImage: 'linear-gradient(135deg, #E9A9C0 14%, #C79AD8 86%)' },
  { experimental_backgroundImage: 'linear-gradient(135deg, #F2C185 14%, #E39AAE 86%)' },
  { experimental_backgroundImage: 'linear-gradient(135deg, #A9C3E9 14%, #C79AD8 86%)' },
];

export const shadow = {
  /** 유리 카드·그룹 */
  glass: { boxShadow: '0px 6px 18px 0px rgba(113,77,127,0.08)' } as ViewStyle,
  /** 홈 입력창 */
  input: { boxShadow: '0px 10px 28px 0px rgba(113,77,127,0.16)' } as ViewStyle,
  /** 사진 카드 */
  photoCard: { boxShadow: '0px 12px 30px 0px rgba(113,77,127,0.2)' } as ViewStyle,
  storyCard: { boxShadow: '0px 12px 28px 0px rgba(62,42,79,0.22)' } as ViewStyle,
  /** 퀴즈 "계속하기"(활성) */
  pearlButton: { boxShadow: '0px 8px 12px 0px rgba(62,42,79,0.18)' } as ViewStyle,
  plumButton: { boxShadow: '0px 10px 24px 0px rgba(113,77,127,0.3)' } as ViewStyle,
  tabBar: { boxShadow: '0px 8px 12px 0px rgba(62,42,79,0.1)' } as ViewStyle,
  chip: { boxShadow: '0px 4px 14px 0px rgba(113,77,127,0.1)' } as ViewStyle,
  playKnob: { boxShadow: '0px 4px 12px 0px rgba(46,33,64,0.2)' } as ViewStyle,
  playLarge: { boxShadow: '0px 8px 24px 0px rgba(0,0,0,0.25)' } as ViewStyle,
  /** 마이 ⊕ 버튼(Figma P01 FAB) */
  fab: { boxShadow: '0px 10px 22px 0px rgba(113,77,127,0.35)' } as ViewStyle,
};

/** 확언 카드(Figma A01): 맨 앞 카드 면, 뒤 카드 그림자 */
export const affirmationCard: ViewStyle = {
  experimental_backgroundImage:
    'linear-gradient(126.6deg, rgba(255,255,255,0.95) 14.286%, rgba(251,245,248,0.92) 50%, rgba(241,233,247,0.92) 85.714%)',
  boxShadow: '0px 18px 40px 0px rgba(113,77,127,0.18), inset 0px 2px 8px 0px #FFFFFF',
};
export const affirmationBackCard: ViewStyle = {
  boxShadow: '0px 10px 24px 0px rgba(113,77,127,0.1)',
};

/** 확언 완료 카드(Figma A03) */
export const affirmationDoneCard: ViewStyle = {
  experimental_backgroundImage:
    'linear-gradient(136.6deg, rgba(255,255,255,0.9) 14.286%, rgba(241,233,247,0.88) 85.714%)',
  boxShadow: '0px 18px 40px 0px rgba(113,77,127,0.18)',
};

/** 공유 시트(Figma A05): 시트 면, 미리보기 그림자, 그라디언트 배경 선택지 */
export const shareSheet: ViewStyle = {
  experimental_backgroundImage: 'linear-gradient(180deg, #F6F0FA 0%, #E9DDF3 100%)',
};
export const shareImageShadow: ViewStyle = { boxShadow: '0px 16px 36px 0px rgba(31,26,51,0.4)' };
export const shareGradientBackground: ViewStyle = {
  experimental_backgroundImage: 'linear-gradient(128.2deg, #F7E8EE 14.286%, #DCE0F5 85.714%)',
};
export const shareText: TextStyle = {
  textShadowColor: 'rgba(46,33,64,0.4)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 10,
};

/** 사진 위 글자 그림자(Figma text-shadow) */
export const photoText: TextStyle = {
  textShadowColor: 'rgba(42,29,51,0.35)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 14,
};
export const photoTextSoft: TextStyle = {
  textShadowColor: 'rgba(42,29,51,0.4)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 8,
};
