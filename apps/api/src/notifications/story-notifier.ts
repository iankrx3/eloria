import { unregisteredTokens, type PushClient } from '@eloria/providers';
import { PUSH_COPY, type PushData } from '@eloria/shared';
import type { PushRepo } from '../repos/push-repo';

/** 앱의 Android 알림 채널 id(apps/mobile/src/notifications)와 같아야 한다. */
export const STORY_CHANNEL_ID = 'stories';

export interface StoryNotifier {
  storyReady(userId: string, storyId: string, title: string | null): Promise<void>;
}

/**
 * 생성 완료 푸시. 앱이 앞에 있으면 앱이 배너를 숨긴다(서버는 앱 상태를 모른다).
 * 앱을 지운 기기의 토큰(DeviceNotRegistered)은 바로 지운다.
 */
export function createStoryNotifier(deps: { repo: PushRepo; client: PushClient }): StoryNotifier {
  return {
    async storyReady(userId, storyId, title) {
      const tokens = await deps.repo.listTokens(userId);
      if (tokens.length === 0) return;
      const data: PushData = { type: 'story_ready', storyId };
      const results = await deps.client.send(
        tokens.map((to) => ({
          to,
          title: PUSH_COPY.storyReady.title(title),
          body: PUSH_COPY.storyReady.body,
          data,
          channelId: STORY_CHANNEL_ID,
          sound: 'default',
        })),
      );
      await deps.repo.deleteTokens(unregisteredTokens(results));
    },
  };
}
