import { groupRituals, type RitualItem } from './group-rituals';

const item = (storyId: string, category: RitualItem['category'], sort: number): RitualItem => ({
  storyId,
  category,
  title: storyId,
  durationSec: 60,
  sort,
  isFree: sort === 0,
});

describe('groupRituals', () => {
  const items = [item('m2', 'money', 1), item('d1', 'meditation', 0), item('m1', 'money', 0)];

  it('카테고리 순서대로, 안에서는 sort 순으로 묶고 빈 카테고리는 뺀다', () => {
    const sections = groupRituals(items);
    expect(sections.map((s) => s.category)).toEqual(['money', 'meditation']);
    expect(sections[0]!.data.map((i) => i.storyId)).toEqual(['m1', 'm2']);
  });

  it('카테고리를 고르면 그 카테고리만', () => {
    expect(groupRituals(items, 'meditation').map((s) => s.category)).toEqual(['meditation']);
    expect(groupRituals(items, 'love')).toEqual([]);
  });
});
