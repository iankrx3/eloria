import type { StoryStatus } from '@eloria/shared';

export type LibraryStory = {
  id: string;
  status: StoryStatus;
  title: string | null;
  createdAt: string;
  errorCode: string | null;
  desire: { id: string; text: string } | null;
  durationSec: number | null;
};

export type StorySection = { key: string; title: string | null; data: LibraryStory[] };

/**
 * 꿈별로 묶는다(PRD 6절 라이브러리: 내 스토리 꿈별 그룹). 최근 스토리가 있는 꿈이 위로 온다.
 * 입력은 최신순이라고 가정한다. 꿈이 없는 스토리(데일리 등)는 한 묶음으로 모은다.
 */
export function groupByDesire(stories: readonly LibraryStory[]): StorySection[] {
  const sections = new Map<string, StorySection>();
  for (const story of stories) {
    const key = story.desire?.id ?? 'none';
    let section = sections.get(key);
    if (!section) {
      section = { key, title: story.desire?.text ?? null, data: [] };
      sections.set(key, section);
    }
    section.data.push(story);
  }
  return [...sections.values()];
}

/** 생성이 끝나 지울 수 있는 상태인지(서버의 CONFLICT 규칙과 같다) */
export function canDeleteStory(status: StoryStatus, errorCode: string | null) {
  return (
    status === 'failed' ||
    status === 'audio_ready' ||
    status === 'ready' ||
    (status === 'text_ready' && errorCode !== null)
  );
}
