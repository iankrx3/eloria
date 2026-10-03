import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * 환경별 앱 설정. EAS 프로필이 APP_ENV를 넣는다(eas.json).
 * 이 파일이나 plugins를 바꾸면 새 개발 빌드가 필요하다.
 */
type AppEnv = 'development' | 'preview' | 'production';

const APP_ENV = (process.env.APP_ENV ?? 'development') as AppEnv;

// 번들 ID·패키지명은 열린 질문 Q-05. 확정 전 가칭이다.
const BASE_ID = 'com.o3c.eloria';

const VARIANTS: Record<AppEnv, { id: string; name: string; scheme: string }> = {
  development: { id: `${BASE_ID}.dev`, name: 'Eloria Dev', scheme: 'eloria-dev' },
  preview: { id: `${BASE_ID}.preview`, name: 'Eloria Preview', scheme: 'eloria-preview' },
  production: { id: BASE_ID, name: 'Eloria', scheme: 'eloria' },
};

const variant = VARIANTS[APP_ENV];

// 카카오 네이티브 앱 키는 앱 바이너리에 그대로 들어가는 공개값이라 기본값으로 둔다.
// EAS CLI는 .env를 읽지 않고 이 파일을 평가하므로 환경 변수에만 의존하면 eas 명령이 실패한다.
const KAKAO_NATIVE_APP_KEY =
  process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY || '4b62d2588fe1de72e3fc6d4a258f4afc';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: variant.name,
  slug: 'eloria',
  owner: 'streetcat2s-team',
  scheme: variant.scheme,
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: variant.id,
    supportsTablet: false,
  },
  android: {
    package: variant.id,
    adaptiveIcon: {
      backgroundColor: '#F3ECF6',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-audio',
      {
        enableBackgroundPlayback: true,
        // 녹음 기능이 없으므로 마이크 권한을 요청하지 않는다(P2 내 목소리 기능 때 다시 검토).
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
    ['expo-notifications', { color: '#6E4A7E' }],
    [
      'expo-splash-screen',
      { image: './assets/splash-icon.png', imageWidth: 160, backgroundColor: '#F3ECF6' },
    ],
    ['@react-native-seoul/kakao-login', { kakaoAppKey: KAKAO_NATIVE_APP_KEY }],
    [
      'expo-build-properties',
      // 카카오 Android SDK는 카카오 자체 Maven 저장소에서 받는다.
      { android: { extraMavenRepos: ['https://devrepo.kakao.com/nexus/content/groups/public/'] } },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appEnv: APP_ENV,
    eas: {
      projectId: '68095cee-17cd-4733-aefa-991f0684a632',
    },
  },
});
