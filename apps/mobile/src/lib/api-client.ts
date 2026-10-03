import { apiErrorResponseSchema, type ApiErrorCode } from '@eloria/shared';
import type { z } from 'zod';

export class ApiClientError extends Error {
  constructor(
    public readonly code: ApiErrorCode | 'NETWORK',
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

type RequestOptions<T extends z.ZodType> = {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  /** 응답 본문을 검증할 스키마. 204처럼 본문이 없으면 생략한다. */
  schema?: T;
  accessToken?: string;
};

/**
 * API 서버 호출. 요청·응답은 packages/shared의 zod 스키마로 검증한다(CLAUDE.md 데이터 규칙).
 */
export function createApiClient(baseUrl: string, fetchImpl: typeof fetch = fetch) {
  return async function request<T extends z.ZodType>(
    path: string,
    { method = 'GET', body, schema, accessToken }: RequestOptions<T> = {},
  ): Promise<z.infer<T>> {
    let res: Response;
    try {
      res = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers: {
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiClientError('NETWORK', 'network request failed');
    }

    if (!res.ok) {
      const parsed = apiErrorResponseSchema.safeParse(await res.json().catch(() => null));
      if (parsed.success) {
        throw new ApiClientError(parsed.data.error.code, parsed.data.error.message, res.status);
      }
      throw new ApiClientError('INTERNAL', `unexpected ${res.status}`, res.status);
    }

    if (!schema || res.status === 204) return undefined as z.infer<T>;
    return schema.parse(await res.json());
  };
}
