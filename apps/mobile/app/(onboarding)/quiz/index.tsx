import { firstUnansweredStep } from '@eloria/shared';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { PrimaryButton } from '@/components/primary-button';
import { CINEMATIC, stepOf, TRANSITION } from '@/features/onboarding/flow';
import { useQuizAnswers } from '@/features/quiz/use-quiz';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';

/** 이어하기(PRD F-02): 답하지 않은 첫 문항으로, 모두 답했으면 시네마틱으로 보낸다. */
export default function QuizResume() {
  const answers = useQuizAnswers();

  if (answers.isError) {
    return (
      <View className="flex-1 justify-center bg-twilight px-gutter">
        <PrimaryButton variant="pearl" label={ko.common.retry} onPress={() => answers.refetch()} />
      </View>
    );
  }

  if (!answers.isSuccess) {
    return (
      <View className="flex-1 items-center justify-center bg-twilight">
        <ActivityIndicator color={tokens.colors['on-photo']} />
      </View>
    );
  }

  const step = firstUnansweredStep(answers.data);
  if (step === null) return <Redirect href={CINEMATIC} />;
  // 꿈꾸는 삶 섹션은 전환 화면부터 시작한다.
  if (step === stepOf('dream_home')) return <Redirect href={TRANSITION} />;
  return <Redirect href={`/quiz/${step}`} />;
}
