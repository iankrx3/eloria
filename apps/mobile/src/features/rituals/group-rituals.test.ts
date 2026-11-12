import { groupRituals, groupWishBundles, sortRituals, type RitualItem } from './group-rituals';

const item = (
  storyId: string,
  category: RitualItem['category'],
  sort: number,
  extra: Partial<RitualItem> = {},
): RitualItem => ({
  storyId,
  seedKey: storyId,
  category,
  wishTheme: null,
  title: storyId,
  durationSec: 60,
  sort,
  isFree: sort === 0,
  createdAt: '2026-11-12T00:00:00Z',
  ...extra,
});

describe('groupRituals', () => {
  const items = [
    item('m2', 'meditation', 1),
    item('a1', 'affirmation', 0),
    item('m1', 'meditation', 0),
    item('old', 'money', 0),
    item('w1', 'affirmation', 1, { wishTheme: 'exam' }),
  ];

  it('Figma 섹션 순서대로 묶고, 소원 묶음·이전 카테고리는 빼고, 안에서는 sort 순', () => {
    const sections = groupRituals(items);
    expect(sections.map((s) => s.category)).toEqual(['affirmation', 'meditation']);
    expect(sections[0]!.data.map((i) => i.storyId)).toEqual(['a1']);
    expect(sections[1]!.data.map((i) => i.storyId)).toEqual(['m1', 'm2']);
  });

  it('섹션을 고르면 그 섹션만', () => {
    expect(groupRituals(items, 'meditation').map((s) => s.category)).toEqual(['meditation']);
    expect(groupRituals(items, 'sleep')).toEqual([]);
  });
});

describe('groupWishBundles', () => {
  it('테마 순서대로, 안에서는 확언 → 명상 → 수면, 길이를 더한다', () => {
    const bundles = groupWishBundles([
      item('s', 'sleep', 0, { wishTheme: 'home', durationSec: 100 }),
      item('a', 'affirmation', 0, { wishTheme: 'home', durationSec: 30 }),
      item('m', 'meditation', 0, { wishTheme: 'home', durationSec: 50 }),
      item('x', 'affirmation', 0, { wishTheme: 'exam' }),
    ]);
    expect(bundles.map((b) => b.theme)).toEqual(['exam', 'home']);
    expect(bundles[1]!.data.map((i) => i.storyId)).toEqual(['a', 'm', 's']);
    expect(bundles[1]!.durationSec).toBe(180);
  });
});

describe('sortRituals', () => {
  const list = [
    item('long', 'sleep', 0, { durationSec: 900, createdAt: '2026-11-10T00:00:00Z' }),
    item('short', 'sleep', 1, { durationSec: 60, createdAt: '2026-11-12T00:00:00Z' }),
  ];
  it('짧은 순·최신순', () => {
    expect(sortRituals(list, 'short').map((i) => i.storyId)).toEqual(['short', 'long']);
    expect(sortRituals(list, 'recent').map((i) => i.storyId)).toEqual(['short', 'long']);
    expect(sortRituals(list, 'popular').map((i) => i.storyId)).toEqual(['long', 'short']);
  });
});
