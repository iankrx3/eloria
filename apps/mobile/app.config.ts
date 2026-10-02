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
    // 카카오 로그인 플러그인은 네이티브 앱 키를 받은 뒤 추가한다(ROADMAP M1).
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
