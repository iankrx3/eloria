import {
  collectQuizAnswers,
  quizCompleteResponseSchema,
  type QuizAnswers,
  type QuizQuestionKey,
} from '@eloria/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-provider';
import { authedApi } from '@/lib/authed-api';
import { supabase } from '@/lib/supabase';

const answersKey = (userId: string | undefined) => ['quiz-answers', userId] as const;

/** 문항 키와 그 문항의 답 형식이 짝지어진 유니온 */
export type QuizAnswerInput = {
  [K in QuizQuestionKey]: { questionKey: K; answer: QuizAnswers[K] };
}[QuizQuestionKey];

function useUserId() {
  const auth = useAuth();
  return auth.status === 'signed-in' ? auth.session.user.id : undefined;
}

/** 저장된 퀴즈 답변(읽기는 RLS로 직접). 이어하기와 이전 답 표시에 쓴다. */
export function useQuizAnswers() {
  const userId = useUserId();
  return useQuery({
    queryKey: answersKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_answers')
        .select('question_key, answer')
        .eq('user_id', userId!);
      if (error) throw error;
      return collectQuizAnswers(data);
    },
  });
}

/** 답변 저장(쓰기는 API, docs/API.md). 성공하면 캐시에 바로 반영한다. */
export function useSaveQuizAnswer() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: QuizAnswerInput) => {
      await authedApi('/v1/quiz/answers', { method: 'POST', body: input });
      return input;
    },
    onSuccess: ({ questionKey, answer }) => {
      queryClient.setQueryData<Partial<QuizAnswers>>(answersKey(userId), (prev) => ({
        ...prev,
        [questionKey]: answer,
      }));
    },
  });
}

/** 마지막 문항 뒤에 퀴즈 답변을 프로필에 반영한다. */
export function useCompleteQuiz() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      authedApi('/v1/quiz/complete', { method: 'POST', schema: quizCompleteResponseSchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', userId] }),
  });
}
