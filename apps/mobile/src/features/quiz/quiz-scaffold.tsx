import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ko } from '@/i18n/ko';

type Props = {
  step: number;
  total: number;
  title: string;
  helper?: string;
  onBack?: () => void;
  error?: string;
  footer?: ReactNode;
  children: ReactNode;
};

/** 퀴즈 1문항 화면의 공통 틀(DESIGN 4절: 상단 진행 바와 "n / 12", 큰 질문, 보조 문구). */
export function QuizScaffold({
  step,
  total,
  title,
  helper,
  onBack,
  error,
  footer,
  children,
}: Props) {
  return (
    <SafeAreaView className="flex-1 bg-dawn">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="gap-3 px-gutter pt-2">
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: total, now: step }}
            className="h-1 overflow-hidden rounded-full bg-dawn-2"
          >
            <View
              className="h-1 rounded-full bg-plum"
              style={{ width: `${(step / total) * 100}%` }}
            />
          </View>
          <View className="h-8 flex-row items-center justify-between">
            {onBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={ko.quiz.back}
                onPress={onBack}
              >
                <Text className="text-[13px] text-ink-muted">{ko.quiz.back}</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <Text className="text-[13px] text-ink-muted">
              {ko.onboarding.progress(step, total)}
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-6 px-gutter pb-6 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-2">
            <Text accessibilityRole="header" className="text-[28px] leading-[38px] text-plum-deep">
              {title}
            </Text>
            {helper && <Text className="text-[13px] leading-[18px] text-ink-muted">{helper}</Text>}
          </View>
          {children}
        </ScrollView>

        {(footer || error) && (
          <View className="gap-2 px-gutter pb-4">
            {error && (
              <Text accessibilityLiveRegion="polite" className="text-center text-[13px] text-plum">
                {error}
              </Text>
            )}
            {footer}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
