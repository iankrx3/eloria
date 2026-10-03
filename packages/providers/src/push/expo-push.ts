/**
 * Expo 푸시 서비스 어댑터(https://docs.expo.dev/push-notifications/sending-notifications/).
 * 한 번에 최대 100건. 429·5xx는 한 번 다시 시도하고, 타임아웃은 10초.
 */
const ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const CHUNK = 100;
const TIMEOUT_MS = 10_000;

export type PushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  /** Android 알림 채널. 앱이 만든 채널 id와 같아야 한다. */
  channelId?: string;
  sound?: 'default' | null;
};

export type PushTicket =
  { status: 'ok'; id: string } | { status: 'error'; message: string; details?: { error?: string } };

export type PushResult = { to: string; ticket: PushTicket };

export interface PushClient {
  send(messages: PushMessage[]): Promise<PushResult[]>;
}

export function createExpoPushClient(
  opts: {
    accessToken?: string;
    fetchImpl?: typeof fetch;
  } = {},
): PushClient {
  const fetchImpl = opts.fetchImpl ?? fetch;

  async function post(chunk: PushMessage[], attempt = 1): Promise<PushTicket[]> {
    const res = await fetchImpl(ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(opts.accessToken ? { Authorization: `Bearer ${opts.accessToken}` } : {}),
      },
      body: JSON.stringify(chunk),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 2) return post(chunk, attempt + 1);
    if (!res.ok) throw new Error(`expo push ${res.status}`);
    const json = (await res.json()) as { data?: PushTicket[] };
    if (!Array.isArray(json.data) || json.data.length !== chunk.length) {
      throw new Error('expo push: unexpected response');
    }
    return json.data;
  }

  return {
    async send(messages) {
      const results: PushResult[] = [];
      for (let i = 0; i < messages.length; i += CHUNK) {
        const chunk = messages.slice(i, i + CHUNK);
        const tickets = await post(chunk);
        chunk.forEach((m, j) => results.push({ to: m.to, ticket: tickets[j]! }));
      }
      return results;
    },
  };
}

/** 더 이상 유효하지 않아 지워야 하는 토큰(앱 삭제 등) */
export function unregisteredTokens(results: readonly PushResult[]): string[] {
  return results
    .filter((r) => r.ticket.status === 'error' && r.ticket.details?.error === 'DeviceNotRegistered')
    .map((r) => r.to);
}
