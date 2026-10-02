import { healthResponseSchema } from '@eloria/shared';
import { ApiClientError, createApiClient } from './api-client';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('createApiClient', () => {
  it('응답을 스키마로 검증하고 토큰을 Bearer로 보낸다', async () => {
    const fetchMock = jest.fn(async () =>
      jsonResponse(200, { status: 'ok', time: '2026-10-02T00:00:00.000Z' }),
    );
    const api = createApiClient('http://api.test', fetchMock as unknown as typeof fetch);

    const res = await api('/v1/health', { schema: healthResponseSchema, accessToken: 'tok' });

    expect(res.status).toBe('ok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/v1/health',
      expect.objectContaining({ headers: { Authorization: 'Bearer tok' } }),
    );
  });

  it('API 에러 형식을 ApiClientError로 바꾼다', async () => {
    const fetchMock = jest.fn(async () =>
      jsonResponse(429, { error: { code: 'QUOTA_EXCEEDED', message: 'limit' } }),
    );
    const api = createApiClient('http://api.test', fetchMock as unknown as typeof fetch);

    await expect(api('/v1/manifests', { method: 'POST', body: {} })).rejects.toMatchObject({
      code: 'QUOTA_EXCEEDED',
      status: 429,
    });
  });

  it('스키마와 다른 응답은 통과시키지 않는다', async () => {
    const fetchMock = jest.fn(async () => jsonResponse(200, { status: 'nope' }));
    const api = createApiClient('http://api.test', fetchMock as unknown as typeof fetch);

    await expect(api('/v1/health', { schema: healthResponseSchema })).rejects.not.toBeInstanceOf(
      ApiClientError,
    );
  });
});
