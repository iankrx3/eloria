import { lifestyleSuggestionsResponseSchema } from '@eloria/shared';
import { useMutation } from '@tanstack/react-query';
import { authedApi } from '@/lib/authed-api';

/** 라이프스타일 AI 추천(Figma P01 ↻). 서버가 하루 3번까지 만든다. 저장은 고른 뒤에 한다. */
export function useLifestyleSuggestions() {
  return useMutation({
    mutationFn: () =>
      authedApi('/v1/profile/lifestyle-suggestions', {
        method: 'POST',
        schema: lifestyleSuggestionsResponseSchema,
      }),
  });
}
