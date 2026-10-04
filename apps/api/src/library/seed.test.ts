import { LIBRARY_CATEGORY } from '@eloria/shared';
import { describe, expect, it } from 'vitest';
import { LIBRARY_CATALOG } from './catalog';
import { planLibrarySeed, seedLibrary, type LibraryRepo, type LibrarySeedItem } from './seed';

describe('LIBRARY_CATALOG', () => {
  it('카테고리마다 5개 이상, key는 겹치지 않는다', () => {
    for (const category of LIBRARY_CATEGORY) {
      expect(LIBRARY_CATALOG.filter((e) => e.category === category).length).toBeGreaterThanOrEqual(
        5,
      );
    }
    const keys = LIBRARY_CATALOG.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('결과 보장·투자·의료 표현을 쓰지 않는다(PRD 10절)', () => {
    const banned = /반드시|무조건|보장|투자|주식|코인|치료|완치/;
    for (const e of LIBRARY_CATALOG) expect(e.theme).not.toMatch(banned);
  });
});

describe('planLibrarySeed', () => {
  it('카테고리 안 순서대로 sort를 매기고 첫 항목만 무료', () => {
    const plan = planLibrarySeed(LIBRARY_CATALOG, []);
    const money = plan.filter((i) => i.category === 'money');
    expect(money.map((i) => i.sort)).toEqual([0, 1, 2, 3, 4]);
    expect(money.map((i) => i.isFree)).toEqual([true, false, false, false, false]);
  });

  it('이미 만든 항목은 건너뛰되 나머지의 순서·무료 여부는 그대로', () => {
    const first = LIBRARY_CATALOG.find((e) => e.category === 'love')!;
    const plan = planLibrarySeed(LIBRARY_CATALOG, [first.key], ['love']);
    expect(plan).toHaveLength(4);
    expect(plan[0]).toMatchObject({ sort: 1, isFree: false });
    expect(plan.every((i) => i.category === 'love')).toBe(true);
  });
});

describe('seedLibrary', () => {
  it('다시 돌려도 같은 항목을 또 만들지 않는다', async () => {
    const created: LibrarySeedItem[] = [];
    const repo: LibraryRepo = {
      listSeedKeys: async () => created.map((i) => i.key),
      createItem: async (item) => {
        created.push(item);
        return `story-${created.length}`;
      },
    };
    expect(await seedLibrary(repo, LIBRARY_CATALOG)).toHaveLength(LIBRARY_CATALOG.length);
    expect(await seedLibrary(repo, LIBRARY_CATALOG)).toEqual([]);
  });
});
