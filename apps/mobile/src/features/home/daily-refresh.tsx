import { DAILY_REFRESH_HOUR } from '@eloria/shared';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useProfile } from '@/features/profile/use-profile';
import { ko } from '@/i18n/ko';
import { dailyProgress, shadow } from '@/theme/effects';

const DAY = 24 * 60 * 60;

/** 지금이 사용자 시간대로 몇 시 몇 분 몇 초인지 */
function localSeconds(now: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(now);
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === t)?.value ?? 0);
  // 일부 환경은 자정을 24시로 준다.
  return (get('hour') % 24) * 3600 + get('minute') * 60 + get('second');
}

/**
 * 다음 이야기까지 남은 시간(Figma H01 "Daily refresh"). 사용자 시간대 자정(DAILY_REFRESH_HOUR)에
 * 오늘의 이야기가 바뀐다. 막대는 오늘 주기에서 지난 비율.
 */
export function DailyRefresh() {
  const timeZone = useProfile().data?.timezone ?? undefined;
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const since = (localSeconds(now, timeZone) - DAILY_REFRESH_HOUR * 3600 + DAY) % DAY;
  const left = DAY - since;
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;

  return (
    <View
      accessible
      accessibilityLabel={`${ko.daily.countdownA11y(h, m)}. ${ko.daily.caption}`}
      className="items-center gap-[6px] rounded-[22px] border border-on-photo bg-on-photo/60 p-5"
      style={shadow.glass}
    >
      <Text className="font-display-semibold text-[11px] tracking-[2.75px] text-plum-deep/60">
        {ko.daily.eyebrow}
      </Text>
      <Text className="font-display text-[40px] tracking-[1.6px] text-plum-deep">
        {ko.daily.countdown(h, m, s)}
      </Text>
      <View className="h-[3px] w-[240px] rounded-[2px]" style={dailyProgress(since / DAY)} />
      <Text className="font-sans text-[12px] leading-[17px] text-plum-deep/60">
        {ko.daily.caption}
      </Text>
    </View>
  );
}
