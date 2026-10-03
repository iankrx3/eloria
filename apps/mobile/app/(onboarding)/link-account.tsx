import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connectKakao, type KakaoConnectResult } from '@/features/auth/kakao';
import { ko } from '@/i18n/ko';

type Status = 'idle' | 'pending' | KakaoConnectResult['kind'] | 'cancelled' | 'failed';

const MESSAGE: Partial<Record<Status, string>> = {
  linked: ko.linkAccount.linked,
  switched: ko.linkAccount.switched,
  'signed-in': ko.linkAccount.signedIn,
  cancelled: ko.linkAccount.cancelled,
  failed: ko.linkAccount.failed,
};

/**
 * 익명 계정에 소셜 계정을 연결한다(PRD F-01, DECISIONS D-08).
 * 지금은 카카오만 있다. Apple·Google은 키를 받은 뒤 같은 화면에 추가한다.
 */
export default function LinkAccount() {
  const [status, setStatus] = useState<Status>('idle');

  async function onKakao() {
    setStatus('pending');
    try {
      const result = await connectKakao();
      setStatus(result.kind);
    } catch (e) {
      // 개발 빌드에서만 원인을 Metro 로그로 남긴다(토큰 값은 담기지 않는다).
      if (__DEV__) console.warn('[link-account] kakao failed', e);
      const cancelled = e instanceof Error && /cancel/i.test(e.message);
      setStatus(cancelled ? 'cancelled' : 'failed');
    }
  }

  const message = MESSAGE[status];

  return (
    <SafeAreaView className="flex-1 bg-dawn">
      <View className="flex-1 justify-between px-gutter py-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ko.linkAccount.close}
          onPress={() => router.back()}
          className="self-end py-2"
        >
          <Text className="text-[16px] text-ink-muted">{ko.linkAccount.close}</Text>
        </Pressable>

        <View className="gap-4">
          <Text className="text-[28px] leading-[38px] text-plum-deep">{ko.linkAccount.title}</Text>
          <Text className="text-[16px] leading-[24px] text-ink-muted">{ko.linkAccount.body}</Text>
        </View>

        <View className="gap-3">
          {message && (
            <Text accessibilityLiveRegion="polite" className="text-center text-[13px] text-plum">
              {message}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ko.linkAccount.kakao}
            disabled={status === 'pending'}
            onPress={onKakao}
            className="h-[52px] flex-row items-center justify-center rounded-kakao bg-kakao"
          >
            {status === 'pending' ? (
              <ActivityIndicator />
            ) : (
              <Text className="text-[16px] text-kakao-label">{ko.linkAccount.kakao}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
