import type { QuizQuestionKey } from '@eloria/shared';
import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhotoBackground } from '@/components/backgrounds';
import { quizProgress } from '@/features/onboarding/flow';
import { ko } from '@/i18n/ko';
import { photoOverlay, photoText, photoTextSoft } from '@/theme/effects';
import { scenes, type SceneKey } from '@/theme/images';
import { type } from '@/theme/typography';

type Item = QuizQuestionKey | 'transition';

/** 문항별 배경 사진과 보랏빛 필름 농도(Figma 02 Quiz 각 화면) */
const SCENE: Record<Item, { scene: SceneKey; tint: number }> = {
  name: { scene: 'bedroom', tint: 0.28 },
  age: { scene: 'bedroom', tint: 0.28 },
  gender: { scene: 'bedroom', tint: 0.28 },
  desire: { scene: 'cityNight', tint: 0.16 },
  desire_why: { scene: 'cityNight', tint: 0.16 },
  desire_blocker: { scene: 'cityNight', tint: 0.16 },
  relationship_status: { scene: 'sunsetRoom', tint: 0.26 },
  love_desired: { scene: 'sunsetWindow', tint: 0.2 },
  has_person: { scene: 'sunsetRoom', tint: 0.26 },
  person_name: { scene: 'sunsetRoom', tint: 0.26 },
  people: { scene: 'dinner', tint: 0.18 },
  transition: { scene: 'sky', tint: 0.16 },
  dream_home: { scene: 'sunsetWindow', tint: 0.2 },
  dream_days: { scene: 'sunsetWindow', tint: 0.2 },
};

/** 진행 바 + 섹션 라벨 + "n / m"(Figma Quiz / Progress Header) */
export function QuizProgressHeader({
  item,
  showSection = true,
}: {
  item: Item;
  showSection?: boolean;
}) {
  const p = quizProgress(item);
  return (
    <View className="gap-[14px]">
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(p.fraction * 100) }}
        className="h-[3px] overflow-hidden rounded-[2px] bg-on-photo/30"
      >
        <View className="h-[3px] bg-on-photo" style={{ width: `${p.fraction * 100}%` }} />
      </View>
      {showSection && (
        <View className="flex-row justify-between">
          <Text className={`${type.label} text-on-photo/80`} style={photoTextSoft}>
            {ko.quiz.sections[p.section]}
          </Text>
          <Text className={`${type.label} text-on-photo/80`} style={photoTextSoft}>
            {ko.quiz.sectionProgress(p.sectionIndex, p.sectionTotal)}
          </Text>
        </View>
      )}
    </View>
  );
}

type Props = {
  item: Item;
  title: string;
  /** 제목 위 워드마크(첫 문항) */
  brand?: ReactNode;
  error?: string;
  /** 화면 아래쪽 답변 영역 */
  children: ReactNode;
};

/** 퀴즈 1문항 화면의 공통 틀: 사진 배경 · 진행 헤더 · 큰 질문 · 빈 공간 · 아래쪽 답변 */
export function QuizScaffold({ item, title, brand, error, children }: Props) {
  const { scene, tint } = SCENE[item];
  return (
    <PhotoBackground source={scenes[scene]} overlay={photoOverlay(tint)}>
      <SafeAreaView className="flex-1">
        {/* Android는 edge-to-edge라 창이 줄지 않는다. keyboard-controller가 두 플랫폼 모두 키보드 높이만큼 밀어 올린다. */}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ScrollView
            className="flex-1"
            contentContainerClassName="grow px-gutter pb-7 pt-5"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <QuizProgressHeader item={item} />
            <View className="gap-[10px] pt-9">
              {brand}
              <Text
                accessibilityRole="header"
                className={`${type.h1} text-on-photo`}
                style={photoText}
              >
                {title}
              </Text>
            </View>
            <View className="min-h-8 flex-1" />
            <View className="gap-3">
              {error && (
                <Text
                  accessibilityLiveRegion="polite"
                  className={`${type.caption} text-center text-on-photo`}
                  style={photoTextSoft}
                >
                  {error}
                </Text>
              )}
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PhotoBackground>
  );
}
