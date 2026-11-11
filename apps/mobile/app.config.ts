import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * 환경별 앱 설정. EAS 프로필이 APP_ENV를 넣는다(eas.json).
 * 이 파일이나 plugins를 바꾸면 새 개발 빌드가 필요하다.
 */
type AppEnv = 'development' | 'preview' | 'production';

const APP_ENV = (process.env.APP_ENV ?? 'development') as AppEnv;

// 번들 ID·패키지명은 열린 질문 Q-05. 확정 전 가칭이다.
const BASE_ID = 'com.o3c.eloria';

// 표시 이름은 ARIN(D-38). 번들 ID·scheme·slug는 기존 빌드·로그인 설정을 유지하려고 그대로 둔다.
const VARIANTS: Record<AppEnv, { id: string; name: string; scheme: string }> = {
  development: { id: `${BASE_ID}.dev`, name: 'ARIN Dev', scheme: 'eloria-dev' },
  preview: { id: `${BASE_ID}.preview`, name: 'ARIN Preview', scheme: 'eloria-preview' },
  production: { id: BASE_ID, name: 'ARIN', scheme: 'eloria' },
};

const variant = VARIANTS[APP_ENV];

// 카카오 네이티브 앱 키는 앱 바이너리에 그대로 들어가는 공개값이라 기본값으로 둔다.
// EAS CLI는 .env를 읽지 않고 이 파일을 평가하므로 환경 변수에만 의존하면 eas 명령이 실패한다.
const KAKAO_NATIVE_APP_KEY =
  process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY || '4b62d2588fe1de72e3fc6d4a258f4afc';

// FCM(Android 푸시) 설정 파일. 레포에 두지 않고 EAS의 file 타입 환경 변수 GOOGLE_SERVICES_JSON으로
// 받는다(docs/SETUP.md 푸시). 없으면 푸시 없이 빌드된다.
const GOOGLE_SERVICES_FILE = process.env.GOOGLE_SERVICES_JSON;

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
    ...(GOOGLE_SERVICES_FILE ? { googleServicesFile: GOOGLE_SERVICES_FILE } : {}),
    adaptiveIcon: {
      backgroundColor: '#F7F2FA',
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
    'expo-sharing',
    [
      'expo-image-picker',
      {
        // 홈 "내 비전 사진"(Figma H01). 카메라 촬영은 쓰지 않고 앨범에서만 고른다.
        photosPermission: '내 비전 사진을 고르려면 사진 접근 권한이 필요해요.',
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
    [
      'expo-media-library',
      {
        // 확언 공유 이미지 저장(Figma A05)
        photosPermission: '확언 카드 이미지를 앨범에 저장하려면 사진 접근 권한이 필요해요.',
        savePhotosPermission: '확언 카드 이미지를 앨범에 저장할게요.',
        isAccessMediaLocationEnabled: false,
      },
    ],
    [
      'expo-audio',
      {
        enableBackgroundPlayback: true,
        // 녹음 기능이 없으므로 마이크 권한을 요청하지 않는다(P2 내 목소리 기능 때 다시 검토).
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
    ['expo-notifications', { color: '#714D7F' }],
    [
      'expo-splash-screen',
      { image: './assets/splash-icon.png', imageWidth: 200, backgroundColor: '#F7F2FA' },
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
