import { canDeleteStory, groupByDesire, type LibraryStory } from './group-stories';

const story = (id: string, desire: LibraryStory['desire']): LibraryStory => ({
  id,
  status: 'ready',
  title: id,
  createdAt: '2026-10-03T00:00:00Z',
  errorCode: null,
  desire,
  durationSec: 60,
});

describe('groupByDesire', () => {
  it('꿈별로 묶고 최근 스토리가 있는 꿈을 먼저 둔다', () => {
    const sea = { id: 'd1', text: '바다가 보이는 집' };
    const job = { id: 'd2', text: '내 사업' };
    const sections = groupByDesire([
      story('s3', job),
      story('s2', sea),
      story('s1', job),
      story('daily', null),
    ]);

    expect(sections.map((s) => [s.title, s.data.map((d) => d.id)])).toEqual([
      ['내 사업', ['s3', 's1']],
      ['바다가 보이는 집', ['s2']],
      [null, ['daily']],
    ]);
  });

  it('빈 목록이면 빈 배열', () => {
    expect(groupByDesire([])).toEqual([]);
  });
});

describe('canDeleteStory', () => {
  it('생성이 끝난 스토리만 지울 수 있다(서버 CONFLICT 규칙과 같음)', () => {
    expect(canDeleteStory('ready', null)).toBe(true);
    expect(canDeleteStory('audio_ready', null)).toBe(true);
    expect(canDeleteStory('failed', 'GENERATION_FAILED')).toBe(true);
    expect(canDeleteStory('text_ready', 'TTS_FAILED')).toBe(true);
    expect(canDeleteStory('text_ready', null)).toBe(false);
    expect(canDeleteStory('writing', null)).toBe(false);
  });
});
