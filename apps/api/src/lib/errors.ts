import { API_ERROR_STATUS, type ApiErrorCode, type ApiErrorResponse } from '@eloria/shared';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorJson(
  c: Context,
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
) {
  const body: ApiErrorResponse = { error: { code, message, ...(details ? { details } : {}) } };
  return c.json(body, API_ERROR_STATUS[code] as ContentfulStatusCode);
}

/** app.onError에 연결한다. 요청 본문(꿈 원문 등)은 로그에 남기지 않는다(ARCHITECTURE 6절). */
export function handleError(err: Error, c: Context) {
  if (err instanceof ApiError) return errorJson(c, err.code, err.message, err.details);
  // 본문이 JSON이 아니면 c.req.json()이 SyntaxError를 던진다.
  if (err instanceof SyntaxError) {
    return errorJson(c, 'VALIDATION_FAILED', '요청 본문이 올바른 JSON이 아닙니다.');
  }
  if (err instanceof ZodError) {
    return errorJson(c, 'VALIDATION_FAILED', '요청 형식이 올바르지 않습니다.', {
      issues: err.issues.map((i) => ({ path: i.path.join('.'), code: i.code })),
    });
  }
  console.error(`[api] ${c.req.method} ${c.req.path} 처리 중 오류: ${err.name}`);
  return errorJson(c, 'INTERNAL', '잠시 후 다시 시도해 주세요.');
}
