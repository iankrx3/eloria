import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhotoBackground } from '@/components/backgrounds';
import { Icon } from '@/components/icons/icon';
import { MoonSymbol } from '@/components/moon';
import { RoundButton } from '@/components/ui';
import { connectKakao, type KakaoConnectResult } from '@/features/auth/kakao';
import { useProfile, useSetOnboardingCompleted } from '@/features/profile/use-profile';
import { ko } from '@/i18n/ko';
import { loginOverlay, photoText, photoTextSoft } from '@/theme/effects';
import { scenes } from '@/theme/images';
import { type } from '@/theme/typography';

type Status = 'idle' | 'pending' | KakaoConnectResult['kind'] | 'cancelled' | 'failed' | 'apple';

const MESSAGE: Partial<Record<Status, string>> = {
  linked: ko.linkAccount.linked,
  switched: ko.linkAccount.switched,
  'signed-in': ko.linkAccount.signedIn,
  cancelled: ko.linkAccount.cancelled,
  failed: ko.linkAccount.failed,
  apple: ko.linkAccount.appleSoon,
};

/**
 * 로그인(Figma S01). 익명 계정에 소셜 계정을 연결한다(PRD F-01, DECISIONS D-08·D-19).
 * 온보딩(next=home)에서는 시네마틱 다음에 열리고, 끝나면 온보딩을 마치고 홈으로 간다(홈이 페이월을 띄운다).
 * 마이페이지에서 열면 연결 후 돌아간다. Apple은 개발자 계정이 생기면 붙인다.
 */
export default function LinkAccount() {
  const [status, setStatus] = useState<Status>('idle');
  const onboarding = useLocalSearchParams<{ next?: string }>().next === 'home';
  const complete = useSetOnboardingCompleted();
  const name = useProfile().data?.displayName ?? null;

  const leave = () => {
    if (!onboarding) return router.back();
    complete.mutate(true, {
      onSuccess: () => router.replace({ pathname: '/', params: { welcome: '1' } }),
      onError: () => setStatus('failed'),
    });
  };

  async function onKakao() {
    setStatus('pending');
    try {
      const result = await connectKakao();
      setStatus(result.kind);
      leave();
    } catch (e) {
      // 개발 빌드에서만 원인을 Metro 로그로 남긴다(토큰 값은 담기지 않는다).
      if (__DEV__) console.warn('[link-account] kakao failed', e);
      const cancelled = e instanceof Error && /cancel/i.test(e.message);
      setStatus(cancelled ? 'cancelled' : 'failed');
    }
  }

  const message = MESSAGE[status];
  const busy = status === 'pending' || complete.isPending;

  return (
    <PhotoBackground source={scenes.dawnRiver} overlay={loginOverlay}>
      <SafeAreaView className="flex-1 px-gutter pb-10 pt-5">
        {!onboarding && (
          <View className="absolute right-gutter top-14 z-10">
            <RoundButton
              icon="close"
              label={ko.linkAccount.close}
              tone="photo"
              onPress={() => router.back()}
            />
          </View>
        )}

        <View
          accessible
          accessibilityLabel={ko.brand.name}
          className="items-center gap-[6px] pt-10"
        >
          <MoonSymbol size={40} />
          <Text className="font-display text-[40px] tracking-[8px] text-on-photo" style={photoText}>
            {ko.brand.name}
          </Text>
          <Text className="font-display-semibold text-[12px] tracking-[2.2px] text-on-photo/80">
            {ko.brand.tagline}
          </Text>
        </View>

        <View className="flex-1" />

        <Text accessibilityRole="header" className={`${type.h1} text-on-photo`} style={photoText}>
          {ko.linkAccount.title(name)}
        </Text>
        <Text className={`${type.body} mt-[10px] text-on-photo/90`} style={photoTextSoft}>
          {ko.linkAccount.body}
        </Text>

        <View className="mt-7 gap-3">
          {message && (
            <Text
              accessibilityLiveRegion="polite"
              className={`${type.caption} text-center text-on-photo`}
              style={photoTextSoft}
            >
              {message}
            </Text>
          )}
          {/* 카카오 디자인 가이드: #FEE500, 말풍선 검정 90%, 글자 #191919, 라운드 12 */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ko.linkAccount.kakao}
            disabled={busy}
            onPress={onKakao}
            className="h-[52px] flex-row items-center justify-center gap-2 rounded-kakao bg-kakao"
          >
            {busy ? (
              <ActivityIndicator color="#191919" />
            ) : (
              <>
                <Icon name="kakao" size={18} />
                <Text className={`${type.bodyMedium} text-kakao-label`}>
                  {ko.linkAccount.kakao}
                </Text>
              </>
            )}
          </Pressable>
          {Platform.OS === 'ios' && (
            // Apple 가이드: 다른 로그인 버튼보다 작게 만들지 않는다.
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={ko.linkAccount.apple}
              disabled={busy}
              onPress={() => setStatus('apple')}
              className="h-[52px] flex-row items-center justify-center gap-[6px] rounded-kakao bg-on-photo"
            >
              <Icon name="apple" size={17} />
              <Text className={`${type.bodyMedium} text-black`}>{ko.linkAccount.apple}</Text>
            </Pressable>
          )}
          {onboarding && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={ko.linkAccount.later}
              disabled={busy}
              onPress={leave}
              className="items-center py-1"
            >
              <Text className={`${type.caption} text-on-photo/80`}>{ko.linkAccount.later}</Text>
            </Pressable>
          )}
          <Text className={`${type.caption} text-center text-on-photo/70`}>
            {ko.linkAccount.consent}
          </Text>
        </View>
      </SafeAreaView>
    </PhotoBackground>
  );
}
