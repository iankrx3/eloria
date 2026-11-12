import {
  LIBRARY_SECTIONS,
  WISH_BUNDLE_ORDER,
  WISH_THEMES,
  type LibraryCategory,
  type LibrarySection,
  type WishTheme,
} from '@eloria/shared';

export type RitualItem = {
  storyId: string;
  seedKey: string;
  category: LibraryCategory;
  wishTheme: WishTheme | null;
  title: string | null;
  durationSec: number | null;
  sort: number;
  isFree: boolean;
  createdAt: string;
};

export type RitualSection = { category: LibrarySection; data: RitualItem[] };
export type WishBundle = { theme: WishTheme; data: RitualItem[]; durationSec: number };

/** Figma 카드 순서대로 맨 앞에 둘 항목(나중에 추가돼 sort가 뒤인 것) */
const PINNED: readonly string[] = [
  'meditation-full-moon',
  'meditation-love-again',
  'meditation-wealth-vessel',
];
const pin = (key: string) => {
  const i = PINNED.indexOf(key);
  return i === -1 ? PINNED.length : i;
};
const bySort = (a: RitualItem, b: RitualItem) =>
  pin(a.seedKey) - pin(b.seedKey) || a.sort - b.sort || a.seedKey.localeCompare(b.seedKey);

/**
 * Figma L01 섹션 순서(확언 → 주파수 → 명상 → 수면 → 노래)대로 묶는다. 소원 묶음 항목과
 * ARIN 이전 카테고리(money·love·career·confidence)는 섹션에 넣지 않는다. 빈 섹션은 뺀다.
 */
export function groupRituals(items: readonly RitualItem[], only?: LibrarySection): RitualSection[] {
  return LIBRARY_SECTIONS.filter((c) => !only || c === only)
    .map((category) => ({
      category,
      data: items.filter((i) => i.category === category && !i.wishTheme).sort(bySort),
    }))
    .filter((s) => s.data.length > 0);
}

/** 소원별로 듣기(L06): 테마마다 확언 → 명상 → 수면 순서. 항목이 없는 테마는 뺀다. */
export function groupWishBundles(items: readonly RitualItem[]): WishBundle[] {
  const rank = (c: LibraryCategory) => {
    const i = (WISH_BUNDLE_ORDER as readonly LibraryCategory[]).indexOf(c);
    return i === -1 ? WISH_BUNDLE_ORDER.length : i;
  };
  return WISH_THEMES.map((theme) => {
    const data = items
      .filter((i) => i.wishTheme === theme)
      .sort((a, b) => rank(a.category) - rank(b.category) || bySort(a, b));
    return { theme, data, durationSec: data.reduce((sum, i) => sum + (i.durationSec ?? 0), 0) };
  }).filter((b) => b.data.length > 0);
}

/** 전체 보기(L04) 정렬: 인기순(카탈로그 순서) · 짧은 순 · 최신순 */
export const LIBRARY_SORTS = ['popular', 'short', 'recent'] as const;
export type LibrarySort = (typeof LIBRARY_SORTS)[number];

export function sortRituals(items: readonly RitualItem[], by: LibrarySort): RitualItem[] {
  const list = [...items];
  if (by === 'short') return list.sort((a, b) => (a.durationSec ?? 0) - (b.durationSec ?? 0));
  if (by === 'recent') return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return list.sort(bySort);
}
