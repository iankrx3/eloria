import { z } from 'zod';
import { TONE } from './quiz';

/** 리추얼(공용 Library) 카테고리(PRD F-10, DATA_MODEL library_items) */
export const LIBRARY_CATEGORY = ['money', 'love', 'career', 'confidence', 'meditation'] as const;
export const libraryCategorySchema = z.enum(LIBRARY_CATEGORY);
export type LibraryCategory = z.infer<typeof libraryCategorySchema>;

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
