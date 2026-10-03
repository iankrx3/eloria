import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { ActivityIndicator, View } from 'react-native';
import { PrimaryButton } from '@/components/primary-button';
import { useAuth } from '@/features/auth/auth-provider';
import { TabBar } from '@/features/navigation/tab-bar';
import { ONBOARDING_START } from '@/features/onboarding/flow';
import { useProfile } from '@/features/profile/use-profile';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';

/**
 * 앱의 "/"는 홈 탭이다. 온보딩을 마치지 않았으면 퀴즈로 보낸다.
 * 세션이 없으면 AuthProvider가 익명 로그인을 하는 동안 잠깐 기다린다.
 * JS 탭을 쓰는 이유: 미니 플레이어를 iOS·Android 모두 탭 위에 고정해야 한다(D-24).
 */
export default function TabsLayout() {
  const auth = useAuth();
  const profile = useProfile();

  if (profile.isError) {
    return (
      <View className="flex-1 justify-center bg-dawn px-gutter">
        <PrimaryButton label={ko.common.retry} onPress={() => profile.refetch()} />
      </View>
    );
  }

  if (auth.status !== 'signed-in' || !profile.isSuccess) {
    return (
      <View className="flex-1 items-center justify-center bg-dawn">
        <ActivityIndicator color={tokens.colors.plum} />
      </View>
    );
  }

  if (!profile.data.onboardingCompletedAt) return <Redirect href={ONBOARDING_START} />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: tokens.colors.dawn },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="rituals" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}
