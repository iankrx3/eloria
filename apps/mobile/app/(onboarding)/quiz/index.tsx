import { firstUnansweredStep } from '@eloria/shared';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { PrimaryButton } from '@/components/primary-button';
import { useQuizAnswers } from '@/features/quiz/use-quiz';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';

/** 이어하기(PRD F-02): 답하지 않은 첫 문항으로, 모두 답했으면 첫 꿈 입력으로 보낸다. */
export default function QuizResume() {
  const answers = useQuizAnswers();

  if (answers.isError) {
    return (
      <View className="flex-1 justify-center bg-dawn px-gutter">
        <PrimaryButton label={ko.common.retry} onPress={() => answers.refetch()} />
      </View>
    );
  }

  if (!answers.isSuccess) {
    return (
      <View className="flex-1 items-center justify-center bg-dawn">
        <ActivityIndicator color={tokens.colors.plum} />
      </View>
    );
  }

  const step = firstUnansweredStep(answers.data);
  return <Redirect href={step === null ? '/first-manifest' : `/quiz/${step}`} />;
}
