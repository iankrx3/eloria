import {
  NAME_MAX,
  QUIZ_QUESTIONS,
  QUIZ_TEXT_MAX,
  type QuizAnswers,
  type QuizQuestionKey,
} from '@eloria/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useCreateManifest } from '@/features/manifest/use-create-manifest';
import { CINEMATIC, nextAfterQuizStep } from '@/features/onboarding/flow';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';
import { GridStep, NumberStep, PeopleStep, SingleStep, SkippableTextStep, TextStep } from './steps';
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

/**
 * 퀴즈 1문항 화면. 답을 저장(API)한 뒤 다음 문항으로 간다. 마지막 문항이면 프로필에 반영하고
 * "요즘 가장 이루고 싶은 것"으로 첫 이야기 생성을 시작한 뒤 시네마틱으로 간다(Figma Q13 노트).
 */
export function QuizStepScreen({ step }: { step: number }) {
  const question = QUIZ_QUESTIONS[step - 1]!;
  const answers = useQuizAnswers();
  const save = useSaveQuizAnswer();
  const complete = useCompleteQuiz();
  const createManifest = useCreateManifest();
  const [error, setError] = useState<string>();

  if (answers.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-twilight">
        <ActivityIndicator color={tokens.colors['on-photo']} />
      </View>
    );
  }

  const initial: Partial<QuizAnswers> = answers.data ?? {};
  const name = initial.name ?? '';
  const pending = save.isPending || complete.isPending || createManifest.isPending;

  const submit =
    <K extends QuizQuestionKey>(key: K) =>
    async (answer: QuizAnswers[K]) => {
      setError(undefined);
      try {
        // 제네릭 K로는 TS가 유니온 짝을 좁히지 못해 단언한다(키와 답 형식은 submit(key)가 보장).
        await save.mutateAsync({ questionKey: key, answer } as QuizAnswerInput);
        const next = nextAfterQuizStep(step, { ...initial, [key]: answer });
        if (next === CINEMATIC) {
          await complete.mutateAsync();
          // 첫 이야기는 뒤에서 만든다. 실패해도(한도·네트워크) 홈에서 다시 만들 수 있으니 흐름은 막지 않는다.
          if (initial.desire) {
            createManifest.mutate(
              { text: initial.desire },
              { onError: (e) => __DEV__ && console.warn('[quiz] first story failed', e) },
            );
          }
          router.replace(CINEMATIC);
        } else {
          router.push(next);
        }
      } catch (e) {
        if (__DEV__) console.warn('[quiz] save failed', e);
        setError(ko.quiz.saveFailed);
      }
    };

  const scaffold = { item: question.key, title: '', error };
  // 문항을 오갈 때 이전 화면의 입력 상태가 남지 않게 문항마다 새로 그린다.
  const common = { key: question.key, pending };

  switch (question.key) {
    case 'name':
      return (
        <TextStep
          {...common}
          scaffold={{ ...scaffold, title: q.name.title }}
          initial={initial.name}
          onSubmit={submit('name')}
          maxLength={NAME_MAX}
          placeholder={q.name.placeholder}
          privacyNote
        />
      );
    case 'age':
      return (
        <NumberStep
          {...common}
          scaffold={{ ...scaffold, title: q.age.title(name) }}
          initial={initial.age}
          onSubmit={submit('age')}
        />
      );
    case 'gender':
      return (
        <SingleStep
          {...common}
          scaffold={{ ...scaffold, title: q.gender.title }}
          initial={initial.gender}
          onSubmit={submit('gender')}
          options={options(question.options, q.gender.options)}
        />
      );
    case 'desire':
    case 'desire_why':
    case 'desire_blocker':
    case 'dream_days': {
      const key = question.key;
      const copy = q[key];
      return (
        <TextStep
          {...common}
          scaffold={{
            ...scaffold,
            title: typeof copy.title === 'function' ? copy.title(name) : copy.title,
          }}
          initial={initial[key]}
          onSubmit={submit(key)}
          maxLength={QUIZ_TEXT_MAX}
          placeholder={copy.placeholder}
          multiline
        />
      );
    }
    case 'relationship_status':
      return (
        <SingleStep
          {...common}
          scaffold={{ ...scaffold, title: q.relationship_status.title }}
          initial={initial.relationship_status}
          onSubmit={submit('relationship_status')}
          options={options(question.options, q.relationship_status.options)}
        />
      );
    case 'love_desired':
      return (
        <SkippableTextStep
          {...common}
          scaffold={{ ...scaffold, title: q.love_desired.title }}
          initial={initial.love_desired}
          onSubmit={submit('love_desired')}
          maxLength={QUIZ_TEXT_MAX}
          placeholder={q.love_desired.placeholder}
          skipLabel={q.love_desired.skip}
        />
      );
    case 'has_person':
      return (
        <SingleStep
          {...common}
          scaffold={{ ...scaffold, title: q.has_person.title }}
          initial={initial.has_person}
          onSubmit={submit('has_person')}
          options={options(question.options, q.has_person.options)}
        />
      );
    case 'person_name':
      return (
        <TextStep
          {...common}
          scaffold={{ ...scaffold, title: q.person_name.title }}
          initial={initial.person_name}
          onSubmit={submit('person_name')}
          maxLength={NAME_MAX}
          placeholder={q.person_name.placeholder}
        />
      );
    case 'people':
      return (
        <PeopleStep
          {...common}
          scaffold={{ ...scaffold, title: q.people.title(name) }}
          initial={initial.people}
          onSubmit={submit('people')}
        />
      );
    case 'dream_home':
      return (
        <GridStep
          {...common}
          scaffold={{ ...scaffold, title: q.dream_home.title }}
          initial={initial.dream_home}
          onSubmit={submit('dream_home')}
          options={options(question.options, q.dream_home.options)}
          max={question.max}
        />
      );
  }
}
