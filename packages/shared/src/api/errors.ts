import { z } from 'zod';

/** docs/API.md 1절의 에러 코드. HTTP 상태는 API_ERROR_STATUS를 따른다. */
export const apiErrorCodeSchema = z.enum([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'QUOTA_EXCEEDED',
  'RATE_LIMITED',
  'VALIDATION_FAILED',
  'NOT_FOUND',
  'INTERNAL',
]);
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const API_ERROR_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  QUOTA_EXCEEDED: 429,
  RATE_LIMITED: 429,
  VALIDATION_FAILED: 400,
  NOT_FOUND: 404,
  INTERNAL: 500,
} as const satisfies Record<ApiErrorCode, number>;

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
