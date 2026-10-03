import {
  NAME_MAX,
  ONE_YEAR_CHANGE_MAX,
  QUIZ_QUESTIONS,
  type QuizAnswers,
  type QuizQuestionKey,
} from '@eloria/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { QUIZ_TOTAL, nextAfterQuizStep } from '@/features/onboarding/flow';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';
import { MultiStep, NotificationStep, PeopleStep, SingleStep, TextStep } from './steps';
import {
  useCompleteQuiz,
  useQuizAnswers,
  useSaveQuizAnswer,
  type QuizAnswerInput,
} from './use-quiz';

const q = ko.quiz.questions;

function options<K extends string>(keys: readonly K[], labels: Record<K, string>) {
  return keys.map((key) => ({ key, label: labels[key] }));
}

/** 퀴즈 1문항 화면. 답을 저장(API)한 뒤 다음 문항으로, 마지막 문항이면 프로필에 반영하고 첫 꿈으로 간다. */
export function QuizStepScreen({ step }: { step: number }) {
  const question = QUIZ_QUESTIONS[step - 1]!;
  const answers = useQuizAnswers();
  const save = useSaveQuizAnswer();
  const complete = useCompleteQuiz();
  const [error, setError] = useState<string>();

  if (answers.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-dawn">
        <ActivityIndicator color={tokens.colors.plum} />
      </View>
    );
  }

  const pending = save.isPending || complete.isPending;

  const submit =
    <K extends QuizQuestionKey>(key: K) =>
    async (answer: QuizAnswers[K]) => {
      setError(undefined);
      try {
        // 제네릭 K로는 TS가 유니온 짝을 좁히지 못해 단언한다(키와 답 형식은 submit(key)가 보장).
        await save.mutateAsync({ questionKey: key, answer } as QuizAnswerInput);
        if (step === QUIZ_TOTAL) await complete.mutateAsync();
        router.push(nextAfterQuizStep(step));
      } catch (e) {
        if (__DEV__) console.warn('[quiz] save failed', e);
        setError(ko.quiz.saveFailed);
      }
    };

  const scaffold = {
    step,
    total: QUIZ_TOTAL,
    title: q[question.key].title,
    helper:
      'helper' in q[question.key] ? (q[question.key] as { helper: string }).helper : undefined,
    onBack: step > 1 ? () => router.back() : undefined,
    error,
  };
  const initial = answers.data ?? {};
  // 문항을 오갈 때 이전 화면의 입력 상태가 남지 않게 문항마다 새로 그린다.
  const common = { key: question.key, scaffold, pending };

  switch (question.key) {
    case 'name':
      return (
        <TextStep
          {...common}
          initial={initial.name}
          onSubmit={submit('name')}
          maxLength={NAME_MAX}
          placeholder={q.name.placeholder}
        />
      );
    case 'one_year_change':
      return (
        <TextStep
          {...common}
          initial={initial.one_year_change}
          onSubmit={submit('one_year_change')}
          maxLength={ONE_YEAR_CHANGE_MAX}
          placeholder={q.one_year_change.placeholder}
          multiline
        />
      );
    case 'desired_life':
      return (
        <MultiStep
          {...common}
          initial={initial.desired_life}
          onSubmit={submit('desired_life')}
          options={options(question.options, q.desired_life.options)}
        />
      );
    case 'future_self':
      return (
        <MultiStep
          {...common}
          initial={initial.future_self}
          onSubmit={submit('future_self')}
          options={options(question.options, q.future_self.options)}
          max={question.max}
        />
      );
    case 'relationship_status':
      return (
        <SingleStep
          {...common}
          initial={initial.relationship_status}
          onSubmit={submit('relationship_status')}
          options={options(question.options, q.relationship_status.options)}
        />
      );
    case 'day_start':
      return (
        <SingleStep
          {...common}
          initial={initial.day_start}
          onSubmit={submit('day_start')}
          options={options(question.options, q.day_start.options)}
        />
      );
    case 'recent_feeling':
      return (
        <SingleStep
          {...common}
          initial={initial.recent_feeling}
          onSubmit={submit('recent_feeling')}
          options={options(question.options, q.recent_feeling.options)}
        />
      );
    case 'tone':
      return (
        <SingleStep
          {...common}
          initial={initial.tone}
          onSubmit={submit('tone')}
          options={options(question.options, q.tone.options)}
        />
      );
    case 'listen_time':
      return (
        <SingleStep
          {...common}
          initial={initial.listen_time}
          onSubmit={submit('listen_time')}
          options={options(question.options, q.listen_time.options)}
        />
      );
    case 'voice':
      return (
        <SingleStep
          {...common}
          initial={initial.voice}
          onSubmit={submit('voice')}
          options={options(question.options, q.voice.options)}
        />
      );
    case 'people':
      return <PeopleStep {...common} initial={initial.people} onSubmit={submit('people')} />;
    case 'notification':
      return <NotificationStep {...common} onSubmit={submit('notification')} />;
  }
}
