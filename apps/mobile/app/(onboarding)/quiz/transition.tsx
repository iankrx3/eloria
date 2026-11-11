import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhotoBackground } from '@/components/backgrounds';
import { MoonSymbol } from '@/components/moon';
import { stepOf } from '@/features/onboarding/flow';
import { QuizProgressHeader } from '@/features/quiz/quiz-scaffold';
import { useQuizAnswers } from '@/features/quiz/use-quiz';
import { ko } from '@/i18n/ko';
import { photoOverlay, photoText, photoTextSoft } from '@/theme/effects';
import { scenes } from '@/theme/images';
import { type } from '@/theme/typography';
import { haptic } from '@/lib/haptics';

/** 2.5초 뒤 자동으로 다음 문항(탭하면 바로). Figma I01 노트 */
const AUTO_ADVANCE_MS = 2500;

/** 꿈꾸는 삶 섹션 앞 전환 화면(Figma I01): 초승달이 천천히 빛난다. */
export default function QuizTransition() {
  const name = useQuizAnswers().data?.name ?? '';
  const next = () => router.replace(`/quiz/${stepOf('dream_home')}`);

  useEffect(() => {
    haptic('soft');
    const timer = setTimeout(next, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PhotoBackground source={scenes.sky} overlay={photoOverlay(0.16)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ko.common.continue}
        onPress={next}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 px-gutter pb-7 pt-5">
          <QuizProgressHeader item="transition" />
          <View className="flex-1 items-center justify-center gap-9">
            <MoonSymbol size={44} pulse />
            <Text className={`${type.h1} text-center text-on-photo`} style={photoText}>
              {ko.quiz.transition.title(name)}
            </Text>
            <Text className={`${type.body} text-center text-on-photo/90`} style={photoTextSoft}>
              {ko.quiz.transition.body}
            </Text>
          </View>
        </SafeAreaView>
      </Pressable>
    </PhotoBackground>
  );
}
