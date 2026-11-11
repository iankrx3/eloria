import { z } from 'zod';

/** 회원 탈퇴 사유(Figma P04, 선택). 누구인지 남기지 않고 사유만 모은다. */
export const DELETE_REASONS = ['no_change', 'price', 'unused', 'other'] as const;

/** POST /v1/account/delete */
export const accountDeleteRequestSchema = z.object({
  reasons: z.array(z.enum(DELETE_REASONS)).max(DELETE_REASONS.length).default([]),
});
export type AccountDeleteRequest = z.infer<typeof accountDeleteRequestSchema>;
