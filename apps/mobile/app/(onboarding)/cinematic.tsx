import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhotoBackground } from '@/components/backgrounds';
import { PrimaryButton } from '@/components/primary-button';
import { registerPushToken } from '@/features/notifications/push';
import { QuizProgressHeader } from '@/features/quiz/quiz-scaffold';
import { useQuizAnswers } from '@/features/quiz/use-quiz';
import { ko } from '@/i18n/ko';
import { photoOverlay, photoText } from '@/theme/effects';
import { scenes, type SceneKey } from '@/theme/images';
import { type } from '@/theme/typography';
import { haptic } from '@/lib/haptics';

/** 장면마다 2.8초 뒤 자동 전환(크로스페이드), 탭하면 바로 다음(Figma C1~C3 노트) */
const AUTO_ADVANCE_MS = 2800;

type Slide = { scene: SceneKey; tint: number; line: string; centered: boolean };

/**
 * 시네마틱 4장(Figma C1~C4). 이 사이에 첫 이야기가 서버에서 만들어진다.
 * 마지막 "끌어당기기 시작"을 누르면 새 이야기 알림 권한을 묻고 로그인(S01)으로 간다.
 */
export default function Cinematic() {
  const answers = useQuizAnswers().data;
  const name = answers?.name ?? '';
  const t = ko.quiz.cinematic;
  // 사랑을 건너뛰었으면 두 번째 장면 문구를 바꾼다(Figma C2 노트).
  const slides: Slide[] = [
    { scene: 'nightWindow', tint: 0.14, line: t.imagine(name), centered: true },
    {
      scene: 'lampRoom',
      tint: 0.18,
      line: answers?.love_desired === null ? t.day : t.love,
      centered: true,
    },
    { scene: 'champagne', tint: 0.18, line: t.yours, centered: true },
    { scene: 'dawnRiver', tint: 0.18, line: t.waiting(name), centered: false },
  ];
  const [index, setIndex] = useState(0);
  const last = index === slides.length - 1;
  const slide = slides[index]!;
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (index === 2) haptic('soft');
    if (last) return;
    const timer = setTimeout(() => setIndex((i) => i + 1), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [index, last]);

  const start = async () => {
    setStarting(true);
    try {
      // 퀴즈의 알림 단계가 빠졌으므로 여기서 묻는다. 이유는 바로 앞 장면 문구가 대신한다.
      const { granted } = await Notifications.requestPermissionsAsync();
      if (granted) void registerPushToken();
    } catch (e) {
      if (__DEV__) console.warn('[cinematic] notification permission failed', e);
    } finally {
      router.replace({ pathname: '/link-account', params: { next: 'home' } });
    }
  };

  return (
    <Animated.View key={index} entering={FadeIn.duration(600)} exiting={FadeOut} className="flex-1">
      <PhotoBackground source={scenes[slide.scene]} overlay={photoOverlay(slide.tint)}>
        <Pressable
          accessibilityRole={last ? undefined : 'button'}
          accessibilityLabel={last ? undefined : t.next}
          disabled={last}
          onPress={() => setIndex((i) => Math.min(i + 1, slides.length - 1))}
          className="flex-1"
        >
          <SafeAreaView className="flex-1 px-gutter pb-10 pt-5">
            <QuizProgressHeader item="dream_days" showSection={false} />
            <View className={`flex-1 ${slide.centered ? 'items-center pt-14' : 'pt-12'}`}>
              <Text
                accessibilityLiveRegion="polite"
                className={`${type.subtitle} text-on-photo ${slide.centered ? 'text-center' : ''}`}
                style={photoText}
              >
                {slide.line}
              </Text>
            </View>
            {last && (
              <PrimaryButton
                variant="pearl"
                label={t.start}
                loading={starting}
                haptic="success"
                onPress={start}
              />
            )}
          </SafeAreaView>
        </Pressable>
      </PhotoBackground>
    </Animated.View>
  );
}
