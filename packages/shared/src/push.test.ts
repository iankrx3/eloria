import { describe, expect, it } from 'vitest';
import { pushDataSchema, pushTokenRequestSchema } from './push';

describe('pushTokenRequestSchema', () => {
  it('Expo 푸시 토큰 형식만 받는다', () => {
    expect(
      pushTokenRequestSchema.safeParse({ token: 'ExponentPushToken[abc123]', platform: 'android' })
        .success,
    ).toBe(true);
    expect(
      pushTokenRequestSchema.safeParse({ token: 'ExpoPushToken[x]', platform: 'ios' }).success,
    ).toBe(true);
    expect(
      pushTokenRequestSchema.safeParse({ token: 'fcm-raw-token', platform: 'android' }).success,
    ).toBe(false);
    expect(
      pushTokenRequestSchema.safeParse({ token: 'ExponentPushToken[a]', platform: 'web' }).success,
    ).toBe(false);
  });
});

describe('pushDataSchema', () => {
  it('story_ready는 storyId(uuid)가 있어야 한다', () => {
    const storyId = '33333333-3333-4333-8333-333333333333';
    expect(pushDataSchema.parse({ type: 'story_ready', storyId })).toEqual({
      type: 'story_ready',
      storyId,
    });
    expect(pushDataSchema.safeParse({ type: 'story_ready', storyId: 'x' }).success).toBe(false);
    expect(pushDataSchema.safeParse({ type: 'other' }).success).toBe(false);
  });
});
