import { z } from 'zod';

/** POST /v1/push-tokens (docs/API.md 2절) */
export const pushTokenRequestSchema = z.object({
  token: z.string().regex(/^Expo(nent)?PushToken\[[^\]]+\]$/, 'Expo 푸시 토큰 형식이 아닙니다.'),
  platform: z.enum(['ios', 'android']),
});
export type PushTokenRequest = z.infer<typeof pushTokenRequestSchema>;

/** 알림에 담아 보내는 데이터. 앱은 눌렀을 때 이 값으로 화면을 연다. */
export const pushDataSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('story_ready'), storyId: z.uuid() }),
]);
export type PushData = z.infer<typeof pushDataSchema>;

/**
 * 푸시 문구. 서버가 보내므로 앱의 i18n/ko.ts에 둘 수 없어 여기에 둔다(카피 원칙은 PRD 10절과 같다).
 */
export const PUSH_COPY = {
  storyReady: {
    title: (storyTitle: string | null) => storyTitle ?? '당신의 하루가 준비됐어요',
    body: '지금 들어 보세요. 오늘도 그 하루를 살아 봐요.',
  },
} as const;
