import { ko } from '@/i18n/ko';

export function durationLabel(sec: number | null) {
  if (!sec) return null;
  return sec >= 60 ? ko.stories.minutes(Math.round(sec / 60)) : ko.stories.seconds(Math.round(sec));
}

export function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}
