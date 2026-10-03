import { describe, expect, it, vi } from 'vitest';
import { createExpoPushClient, unregisteredTokens, type PushMessage } from './expo-push';

const msg = (to: string): PushMessage => ({ to, title: 't', body: 'b' });
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('createExpoPushClient', () => {
  it('토큰별 결과를 돌려주고 액세스 토큰을 Bearer로 보낸다', async () => {
    const fetchImpl = vi.fn(async () =>
      json(200, {
        data: [
          { status: 'ok', id: '1' },
          { status: 'error', message: 'x', details: { error: 'DeviceNotRegistered' } },
        ],
      }),
    );
    const client = createExpoPushClient({
      accessToken: 'tok',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const results = await client.send([msg('A'), msg('B')]);

    expect(results.map((r) => r.to)).toEqual(['A', 'B']);
    expect(unregisteredTokens(results)).toEqual(['B']);
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('5xx는 한 번 다시 시도한다', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json(503, {}))
      .mockResolvedValueOnce(json(200, { data: [{ status: 'ok', id: '1' }] }));
    const client = createExpoPushClient({ fetchImpl: fetchImpl as unknown as typeof fetch });

    await expect(client.send([msg('A')])).resolves.toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('100건씩 나눠 보낸다', async () => {
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      const n = (JSON.parse(String(init.body)) as unknown[]).length;
      return json(200, {
        data: Array.from({ length: n }, (_, i) => ({ status: 'ok', id: String(i) })),
      });
    });
    const client = createExpoPushClient({ fetchImpl: fetchImpl as unknown as typeof fetch });

    const results = await client.send(Array.from({ length: 150 }, (_, i) => msg(`T${i}`)));
    expect(results).toHaveLength(150);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
