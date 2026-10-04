import { LIBRARY_CATEGORY, type LibraryCategory } from '@eloria/shared';

export type RitualItem = {
  storyId: string;
  category: LibraryCategory;
  title: string | null;
  durationSec: number | null;
  sort: number;
  isFree: boolean;
};

export type RitualSection = { category: LibraryCategory; data: RitualItem[] };

/** 카테고리 순서(LIBRARY_CATEGORY)대로 묶고, 카테고리 안은 sort 순. 빈 카테고리는 뺀다. */
export function groupRituals(
  items: readonly RitualItem[],
  only?: LibraryCategory,
): RitualSection[] {
  return LIBRARY_CATEGORY.filter((c) => !only || c === only)
    .map((category) => ({
      category,
      data: items.filter((i) => i.category === category).sort((a, b) => a.sort - b.sort),
    }))
    .filter((s) => s.data.length > 0);
}
