import { pushDataSchema } from '@eloria/shared';
import type { Href } from 'expo-router';

/** 알림 data를 열 화면으로 바꾼다. 모르는 형식이면 null(앱만 연다). */
export function routeForNotification(data: unknown): Href | null {
  const parsed = pushDataSchema.safeParse(data);
  if (!parsed.success) return null;
  switch (parsed.data.type) {
    case 'story_ready':
      return { pathname: '/player/[storyId]', params: { storyId: parsed.data.storyId } };
  }
}
