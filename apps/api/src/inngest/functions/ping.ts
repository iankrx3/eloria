import { inngest } from '../client';

/** Inngest 연결 확인용(M1). dev server UI에서 `system/ping` 이벤트를 보내면 실행된다. */
export const ping = inngest.createFunction(
  { id: 'system-ping', triggers: [{ event: 'system/ping' }] },
  async ({ step }) => {
    const at = await step.run('record-time', () => new Date().toISOString());
    return { pong: true, at };
  },
);
