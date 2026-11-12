import { z } from 'zod';
import { TONE } from './quiz';

/**
 * 공용 라이브러리 카테고리(DATA_MODEL library_items). 앞의 다섯 개가 Figma L01 섹션이고,
 * money·love·career·confidence는 ARIN 이전 리추얼이라 탭에는 보이지 않는다(D-47).
 */
export const LIBRARY_CATEGORY = [
  'affirmation',
  'frequency',
  'meditation',
  'sleep',
  'song',
  'money',
  'love',
  'career',
  'confidence',
] as const;
export const libraryCategorySchema = z.enum(LIBRARY_CATEGORY);
export type LibraryCategory = z.infer<typeof libraryCategorySchema>;

/** 라이브러리 탭 섹션 순서(Figma L01: 확언 → 주파수 → 명상 → 수면 → 끌어당김 노래) */
export const LIBRARY_SECTIONS = [
  'affirmation',
  'frequency',
  'meditation',
  'sleep',
  'song',
] as const;
export type LibrarySection = (typeof LIBRARY_SECTIONS)[number];

/** 소원별로 듣기(Figma L01·L06): 합격 · 내 집 마련 · 이직·연봉 · 연애·결혼 · 바디프로필 · 여행 */
export const WISH_THEMES = ['exam', 'home', 'job', 'love', 'body', 'travel'] as const;
export const wishThemeSchema = z.enum(WISH_THEMES);
export type WishTheme = z.infer<typeof wishThemeSchema>;

/** 소원 묶음 안의 순서(L06: 확언 → 명상 → 수면 순으로 이어 듣기) */
export const WISH_BUNDLE_ORDER = ['affirmation', 'meditation', 'sleep'] as const;

/**
 * 리추얼 이용 범위. 구독 판단은 서버만 한다(CLAUDE.md). 결제(M5) 전까지는 잠그지 않는다.
 * 무료로 여는 개수는 열린 질문 Q-04(ROADMAP).
 */
export const LIBRARY_ACCESS = {
  PAYWALL_ENABLED: false,
  FREE_PER_CATEGORY: 1,
} as const;

/** 시드 카탈로그 한 항목. 테마는 스토리 생성의 "꿈" 자리에 들어간다. */
export const librarySeedEntrySchema = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/),
  category: libraryCategorySchema,
  theme: z.string().min(1).max(200),
  tone: z.enum(TONE),
  /** 카드에 보일 제목(Figma 문구). 생성된 장면 계획의 제목보다 우선한다. */
  title: z.string().min(1).max(30).optional(),
  wishTheme: wishThemeSchema.optional(),
});
export type LibrarySeedEntry = z.infer<typeof librarySeedEntrySchema>;

/** Inngest `library/seed.requested`: 아직 없는 시드 항목을 만들고 생성 이벤트를 보낸다(API.md 4절). */
export const librarySeedRequestedSchema = z.object({
  categories: z.array(libraryCategorySchema).optional(),
});
export type LibrarySeedRequested = z.infer<typeof librarySeedRequestedSchema>;

/** Inngest `library/story.requested`: 공용 스토리 한 편 생성 */
export const libraryStoryRequestedSchema = z.object({ storyId: z.uuid() });
export type LibraryStoryRequested = z.infer<typeof libraryStoryRequestedSchema>;

/**
 * 리추얼 한 편을 들을 수 있는지(서버 판단, CLAUDE.md 권한 규칙). 결제 전에는 모두 연다.
 * 구독 여부는 subscriptions 테이블(M5)에서 서버가 넘긴다.
 */
export function canAccessLibraryItem(input: {
  isFree: boolean;
  subscribed: boolean;
  paywallEnabled?: boolean;
}) {
  const paywall = input.paywallEnabled ?? LIBRARY_ACCESS.PAYWALL_ENABLED;
  return !paywall || input.isFree || input.subscribed;
}
