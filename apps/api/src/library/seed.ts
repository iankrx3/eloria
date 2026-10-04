import { LIBRARY_ACCESS, type LibraryCategory, type LibrarySeedEntry } from '@eloria/shared';

export type LibrarySeedItem = LibrarySeedEntry & { sort: number; isFree: boolean };

export interface LibraryRepo {
  listSeedKeys(): Promise<string[]>;
  /** 공용 스토리(kind=library, queued), 리추얼 항목, 생성 진행 행을 만들고 스토리 id를 돌려준다. */
  createItem(item: LibrarySeedItem): Promise<string>;
}

/**
 * 카탈로그에서 아직 없는 항목만 고른다. 순서는 카테고리 안의 카탈로그 순서이고,
 * 앞의 FREE_PER_CATEGORY개가 무료다(이미 만든 항목이 있어도 위치는 카탈로그 기준).
 */
export function planLibrarySeed(
  catalog: readonly LibrarySeedEntry[],
  existingKeys: readonly string[],
  categories?: readonly LibraryCategory[],
): LibrarySeedItem[] {
  const existing = new Set(existingKeys);
  const position = new Map<LibraryCategory, number>();
  const items: LibrarySeedItem[] = [];
  for (const entry of catalog) {
    const sort = position.get(entry.category) ?? 0;
    position.set(entry.category, sort + 1);
    if (existing.has(entry.key)) continue;
    if (categories && !categories.includes(entry.category)) continue;
    items.push({ ...entry, sort, isFree: sort < LIBRARY_ACCESS.FREE_PER_CATEGORY });
  }
  return items;
}

/** 없는 항목을 만들고 새 스토리 id 목록을 돌려준다. 생성은 호출한 쪽이 이벤트로 넘긴다. */
export async function seedLibrary(
  repo: LibraryRepo,
  catalog: readonly LibrarySeedEntry[],
  categories?: readonly LibraryCategory[],
): Promise<string[]> {
  const items = planLibrarySeed(catalog, await repo.listSeedKeys(), categories);
  const storyIds: string[] = [];
  for (const item of items) storyIds.push(await repo.createItem(item));
  return storyIds;
}
