import '../global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlayerProvider } from '@/audio/player-provider';
import { AuthProvider } from '@/features/auth/auth-provider';
import { configureNotifications } from '@/features/notifications/push';
import { usePushRegistration } from '@/features/notifications/use-push';
import { loadRecentPlays } from '@/audio/recent-plays';
import { loadSleepTimer } from '@/audio/sleep-timer';
import { loadHapticSettings } from '@/lib/haptics';
import tokens from '@/theme/tokens.json';
import PretendardRegular from '../assets/fonts/Pretendard-Regular.otf';
import PretendardMedium from '../assets/fonts/Pretendard-Medium.otf';
import MaruBuriRegular from '../assets/fonts/MaruBuri-Regular.ttf';
import MaruBuriSemiBold from '../assets/fonts/MaruBuri-SemiBold.ttf';
import CormorantGaramondMedium from '../assets/fonts/CormorantGaramond-Medium.ttf';
import CormorantGaramondSemiBold from '../assets/fonts/CormorantGaramond-SemiBold.ttf';

configureNotifications();
void SplashScreen.preventAutoHideAsync();
void loadHapticSettings();
void loadSleepTimer();
void loadRecentPlays();

/** 앱 글꼴(DESIGN 3절). 이름은 tokens.json fontFamily와 같아야 한다. 라이선스: SIL OFL(assets/fonts/LICENSES.md) */
const FONTS = {
  'Pretendard-Regular': PretendardRegular,
  'Pretendard-Medium': PretendardMedium,
  'MaruBuri-Regular': MaruBuriRegular,
  'MaruBuri-SemiBold': MaruBuriSemiBold,
  'CormorantGaramond-Medium': CormorantGaramondMedium,
  'CormorantGaramond-SemiBold': CormorantGaramondSemiBold,
};

function PushRegistration() {
  usePushRegistration();
  return null;
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [fontsLoaded, fontError] = useFonts(FONTS);
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (fontError && __DEV__) console.warn('[fonts] load failed', fontError);
    if (ready) void SplashScreen.hideAsync();
  }, [ready, fontError]);

  // 글꼴이 오기 전에 그리면 시스템 글꼴로 한 번 깜빡이므로 스플래시를 유지한다.
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <PushRegistration />
              <PlayerProvider>
                <StatusBar style="dark" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                    contentStyle: { backgroundColor: tokens.colors.pearl },
                  }}
                >
                  <Stack.Screen name="(onboarding)" />
                  <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
                  <Stack.Screen name="manifest/[id]/progress" options={{ gestureEnabled: false }} />
                  <Stack.Screen name="stories/index" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen
                    name="library-section/[category]"
                    options={{ animation: 'slide_from_right' }}
                  />
                  <Stack.Screen name="wish/[theme]" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen
                    name="saved-affirmations"
                    options={{ animation: 'slide_from_right' }}
                  />
                  <Stack.Screen name="paywall" options={{ presentation: 'fullScreenModal' }} />
                  <Stack.Screen name="story/[storyId]/text" options={{ presentation: 'modal' }} />
                  <Stack.Screen
                    name="player/[storyId]"
                    options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
                  />
                </Stack>
              </PlayerProvider>
            </AuthProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
