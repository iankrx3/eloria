import { routeForNotification } from './notification-route';

const STORY = '33333333-3333-4333-8333-333333333333';

describe('routeForNotification', () => {
  it('story_ready는 플레이어로 연다', () => {
    expect(routeForNotification({ type: 'story_ready', storyId: STORY })).toEqual({
      pathname: '/player/[storyId]',
      params: { storyId: STORY },
    });
  });

  it('모르는 형식이나 빈 data는 무시한다', () => {
    expect(routeForNotification({ type: 'daily_ready' })).toBeNull();
    expect(routeForNotification({ type: 'story_ready', storyId: 'nope' })).toBeNull();
    expect(routeForNotification(undefined)).toBeNull();
  });
});
