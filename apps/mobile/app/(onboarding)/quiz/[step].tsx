import { useLocalSearchParams } from 'expo-router';
import { parseQuizStep } from '@/features/onboarding/flow';
import { QuizStepScreen } from '@/features/quiz/quiz-step-screen';

/** 퀴즈 1문항 1화면(PRD F-02). */
export default function QuizStep() {
  const step = parseQuizStep(useLocalSearchParams<{ step: string }>().step);
  return <QuizStepScreen key={step} step={step} />;
}
