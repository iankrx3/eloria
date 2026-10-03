import { type PushTokenRequest } from '@eloria/shared';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ko } from '@/i18n/ko';
import { authedApi } from '@/lib/authed-api';

/** 서버(apps/api/src/notifications/story-notifier.ts)가 보내는 channelId와 같아야 한다. */
export const STORY_CHANNEL_ID = 'stories';

/**
 * 앱 시작 시 한 번. 앱을 보고 있을 때는 진행 화면이 이미 바뀌므로 배너를 띄우지 않는다.
 * Android 13+는 채널이 하나라도 있어야 권한 프롬프트가 뜬다.
 */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync(STORY_CHANNEL_ID, {
      name: ko.notifications.storyChannel,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/**
 * 권한이 이미 있으면 Expo 푸시 토큰을 서버에 등록한다. 여기서는 권한을 묻지 않는다(퀴즈 알림 단계가 묻는다).
 * FCM 설정이 없는 빌드·에뮬레이터에서는 토큰 발급이 실패하므로 false만 돌려준다.
 */
export async function registerPushToken(): Promise<boolean> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return false;
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return false;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const body: PushTokenRequest = { token, platform: Platform.OS };
    await authedApi('/v1/push-tokens', { method: 'POST', body });
    return true;
  } catch (error) {
    console.warn('[push] token registration failed', error);
    return false;
  }
}
