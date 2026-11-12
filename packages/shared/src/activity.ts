import { z } from 'zod';

/**
 * 연속 기록·21일 챌린지 규칙(Figma H11·H12, DECISIONS D-44).
 * - 그날 기록: 이야기 1개를 끝까지 들었거나(재생 90% 이상) 확언 10장을 모두 넘겼을 때
 * - 챌린지: 하루 1개 미션. 전날까지 완료했으면 다음 미션이 열리고, 놓쳐도 이어서 진행한다
 * 날짜는 사용자 시간대(기본 Asia/Seoul)의 YYYY-MM-DD 문자열로 다룬다.
 */
export const ACTIVITY_RULE = {
  STORIES_PER_DAY: 1,
  AFFIRMATIONS_PER_DAY: 10,
  /** 이 비율 이상 들으면 "끝까지 들음" */
  LISTENED_RATIO: 0.9,
} as const;

export const CHALLENGE_DAYS = 21;
export const DEFAULT_TIMEZONE = 'Asia/Seoul';

export const dayStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export type ActivityDay = { day: string; storiesListened: number; affirmationsDone: number };

export function isRecordedDay(d: ActivityDay) {
  return (
    d.storiesListened >= ACTIVITY_RULE.STORIES_PER_DAY ||
    d.affirmationsDone >= ACTIVITY_RULE.AFFIRMATIONS_PER_DAY
  );
}

/** 시간대 기준 날짜 문자열(YYYY-MM-DD) */
export function localDay(date: Date, timeZone: string = DEFAULT_TIMEZONE): string {
  // en-CA 형식이 YYYY-MM-DD다.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function addDays(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, m - 1, d + delta));
  return t.toISOString().slice(0, 10);
}

export type StreakStats = {
  /** 오늘(또는 오늘 기록 전이면 어제)까지 이어진 날 수 */
  current: number;
  longest: number;
  thisMonth: number;
  total: number;
  recordedToday: boolean;
};

/** 기록된 날 목록으로 연속·최장·이번 달·총 기록 일수를 센다. */
export function streakStats(recordedDays: readonly string[], today: string): StreakStats {
  const set = new Set(recordedDays);
  const sorted = [...set].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = day;
  }
  const recordedToday = set.has(today);
  // 오늘 아직 기록 전이어도 어제까지 이어졌으면 연속은 끊기지 않은 것으로 본다.
  let cursor = recordedToday ? today : addDays(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  const month = today.slice(0, 7);
  return {
    current,
    longest,
    thisMonth: sorted.filter((d) => d.startsWith(month)).length,
    total: sorted.length,
    recordedToday,
  };
}

export type ChallengeState = {
  started: boolean;
  completed: number;
  /** 지금 열려 있는 미션 날(1~21). 다 끝났으면 null */
  openDay: number | null;
  /** 오늘 이미 미션을 했으면 다음 미션은 내일 열린다 */
  doneToday: boolean;
  finished: boolean;
};

/** 완료한 미션(날과 완료 날짜)으로 챌린지 상태를 만든다. */
export function challengeState(
  startedOn: string | null,
  completions: readonly { day: number; completedOn: string }[],
  today: string,
): ChallengeState {
  const completed = completions.length;
  const finished = completed >= CHALLENGE_DAYS;
  const doneToday = completions.some((c) => c.completedOn === today);
  return {
    started: startedOn !== null,
    completed,
    openDay: !startedOn || finished || doneToday ? null : completed + 1,
    doneToday,
    finished,
  };
}

/** 감사 일기(마이 보관함): 하루 최대 3줄, 줄마다 글자 수 상한 */
export const GRATITUDE_LINES = 3;
export const GRATITUDE_LINE_MAX = 100;

/** 빈 줄을 빼고 앞뒤 공백을 지운 감사 일기 줄. 남는 게 없으면 저장하지 않는다. */
export function cleanGratitudeLines(lines: readonly string[]): string[] {
  return lines
    .map((l) => l.trim().slice(0, GRATITUDE_LINE_MAX))
    .filter((l) => l.length > 0)
    .slice(0, GRATITUDE_LINES);
}

/** "당신을 위한 이야기"가 바뀌는 시각(사용자 시간대, H01 카운트다운). */
export const DAILY_REFRESH_HOUR = 5;

/** 데일리 날짜: 새벽 5시 전이면 아직 어제의 데일리다. */
export function dailyDay(now: Date, timezone?: string) {
  return localDay(new Date(now.getTime() - DAILY_REFRESH_HOUR * 60 * 60 * 1000), timezone);
}
