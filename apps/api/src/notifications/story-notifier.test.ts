import type { PushClient, PushMessage } from '@eloria/providers';
import { pushDataSchema } from '@eloria/shared';
import { describe, expect, it } from 'vitest';
import { createFakePushRepo } from '../test/fakes';
import { createStoryNotifier, STORY_CHANNEL_ID } from './story-notifier';

const USER = '11111111-1111-4111-8111-111111111111';
const STORY = '33333333-3333-4333-8333-333333333333';

function fakeClient(deadTokens: string[] = []) {
  const sent: PushMessage[] = [];
  const client: PushClient = {
    async send(messages) {
      sent.push(...messages);
      return messages.map((m) => ({
        to: m.to,
        ticket: deadTokens.includes(m.to)
          ? { status: 'error' as const, message: 'gone', details: { error: 'DeviceNotRegistered' } }
          : { status: 'ok' as const, id: 'x' },
      }));
    },
  };
  return { client, sent };
}

describe('createStoryNotifier', () => {
  it('사용자의 모든 기기에 story_ready 데이터를 담아 보낸다', async () => {
    const push = createFakePushRepo();
    await push.repo.upsertToken(USER, { token: 'ExpoPushToken[a]', platform: 'ios' });
    await push.repo.upsertToken(USER, { token: 'ExpoPushToken[b]', platform: 'android' });
    const { client, sent } = fakeClient();

    await createStoryNotifier({ repo: push.repo, client }).storyReady(USER, STORY, '바다 작업실');

    expect(sent).toHaveLength(2);
    expect(sent[0]!.title).toBe('바다 작업실');
    expect(sent[0]!.channelId).toBe(STORY_CHANNEL_ID);
    expect(pushDataSchema.parse(sent[0]!.data)).toEqual({ type: 'story_ready', storyId: STORY });
  });

  it('토큰이 없으면 보내지 않고, 앱을 지운 기기의 토큰은 지운다', async () => {
    const push = createFakePushRepo();
    const empty = fakeClient();
    await createStoryNotifier({ repo: push.repo, client: empty.client }).storyReady(
      USER,
      STORY,
      null,
    );
    expect(empty.sent).toHaveLength(0);

    await push.repo.upsertToken(USER, { token: 'ExpoPushToken[dead]', platform: 'android' });
    const { client } = fakeClient(['ExpoPushToken[dead]']);
    await createStoryNotifier({ repo: push.repo, client }).storyReady(USER, STORY, null);
    expect(push.tokens.size).toBe(0);
  });
});
