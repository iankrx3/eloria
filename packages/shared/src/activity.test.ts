import { describe, expect, it } from 'vitest';
import {
  challengeState,
  cleanGratitudeLines,
  GRATITUDE_LINE_MAX,
  isRecordedDay,
  localDay,
  streakStats,
} from './activity';

describe('isRecordedDay', () => {
  it('이야기 1개 또는 확언 10장이면 기록', () => {
    expect(isRecordedDay({ day: '2026-11-11', storiesListened: 1, affirmationsDone: 0 })).toBe(
      true,
    );
    expect(isRecordedDay({ day: '2026-11-11', storiesListened: 0, affirmationsDone: 10 })).toBe(
      true,
    );
    expect(isRecordedDay({ day: '2026-11-11', storiesListened: 0, affirmationsDone: 9 })).toBe(
      false,
    );
  });
});

describe('localDay', () => {
  it('서울 시간 기준 날짜', () => {
    // UTC 15:30 = 서울 다음 날 00:30
    expect(localDay(new Date('2026-11-10T15:30:00Z'))).toBe('2026-11-11');
  });
});

describe('streakStats', () => {
  it('연속·최장·이번 달·총 일수', () => {
    const days = [
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-05',
      '2026-11-09',
      '2026-11-10',
    ];
    expect(streakStats(days, '2026-11-11')).toEqual({
      current: 2,
      longest: 3,
      thisMonth: 4,
      total: 6,
      recordedToday: false,
    });
    expect(streakStats([...days, '2026-11-11'], '2026-11-11').current).toBe(3);
    expect(streakStats(['2026-11-08'], '2026-11-11').current).toBe(0);
  });
});

describe('challengeState', () => {
  it('하루 1개, 오늘 했으면 내일 열림, 놓쳐도 이어서', () => {
    expect(challengeState(null, [], '2026-11-11').openDay).toBeNull();
    expect(challengeState('2026-11-01', [], '2026-11-11').openDay).toBe(1);
    const two = [
      { day: 1, completedOn: '2026-11-01' },
      { day: 2, completedOn: '2026-11-05' },
    ];
    expect(challengeState('2026-11-01', two, '2026-11-11')).toMatchObject({
      openDay: 3,
      completed: 2,
    });
    expect(challengeState('2026-11-01', two, '2026-11-05')).toMatchObject({
      openDay: null,
      doneToday: true,
    });
  });
});

describe('cleanGratitudeLines', () => {
  it('빈 줄을 빼고 공백을 지운다', () => {
    expect(cleanGratitudeLines(['  햇살 ', '', '   ', '커피'])).toEqual(['햇살', '커피']);
  });
  it('3줄, 줄당 글자 수를 넘지 않는다', () => {
    const long = 'a'.repeat(GRATITUDE_LINE_MAX + 5);
    const out = cleanGratitudeLines([long, 'b', 'c', 'd']);
    expect(out).toHaveLength(3);
    expect(out[0]).toHaveLength(GRATITUDE_LINE_MAX);
  });
});
