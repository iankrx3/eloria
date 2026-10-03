import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { routeForNotification } from './notification-route';
import { registerPushToken } from './push';

/** 로그인한 사용자가 바뀔 때마다(익명 → 카카오 연결 포함) 토큰을 다시 등록한다. */
export function usePushRegistration() {
  const auth = useAuth();
  const userId = auth.session?.user.id;
  useEffect(() => {
    if (userId) void registerPushToken();
  }, [userId]);
}

/**
 * 알림을 누르면 해당 화면을 연다. 앱이 꺼져 있다가 알림으로 열린 경우도 처리하고,
 * 처리한 응답은 지워서 다음 실행 때 다시 열리지 않게 한다.
 * 탭 레이아웃(온보딩·세션 확인을 통과한 뒤)에서 부른다.
 */
export function useNotificationNavigation() {
  const router = useRouter();
  useEffect(() => {
    const open = (response: Notifications.NotificationResponse) => {
      Notifications.clearLastNotificationResponse();
      const href = routeForNotification(response.notification.request.content.data);
      if (href) router.push(href);
    };

    const last = Notifications.getLastNotificationResponse();
    if (last) open(last);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [router]);
}
