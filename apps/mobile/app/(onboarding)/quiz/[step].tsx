import { router, useLocalSearchParams } from 'expo-router';
import { PlaceholderScreen } from '@/components/placeholder-screen';
import { PrimaryButton } from '@/components/primary-button';
import { QUIZ_TOTAL, nextAfterQuizStep, parseQuizStep } from '@/features/onboarding/flow';
import { ko } from '@/i18n/ko';

/** 퀴즈 1문항 1화면(PRD F-02). 문항 UI와 답변 저장은 다음 작업에서 채운다. */
export default function QuizStep() {
  const step = parseQuizStep(useLocalSearchParams<{ step: string }>().step);

  return (
    <PlaceholderScreen
      eyebrow={ko.onboarding.progress(step, QUIZ_TOTAL)}
      title={ko.brand.name}
      body={ko.onboarding.quizPlaceholder}
      footer={
        <PrimaryButton
          label={ko.common.next}
          onPress={() => router.push(nextAfterQuizStep(step))}
        />
      }
    />
  );
}
