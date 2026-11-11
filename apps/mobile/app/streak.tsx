import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DawnBackdrop, GLOW } from '@/components/backgrounds';
import { Icon } from '@/components/icons/icon';
import { GoldCrescent } from '@/components/moon';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { useActivity } from '@/features/activity/use-activity';
import { ko } from '@/i18n/ko';
import { haptic } from '@/lib/haptics';
import { dawnScreen, shadow } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

const recordedCell = {
  experimental_backgroundImage: 'linear-gradient(135deg, #F6E6EA 14%, #E6D9F0 86%)',
};

/** 달력 칸(일요일 시작). 빈 칸은 null */
function monthGrid(year: number, month: number) {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = Array.from({ length: first }, () => null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 연속 기록(Figma H11): 큰 숫자 · 최장/이번 달/총 · 달력(달이 뜬 날 = 들은 날) · 오늘의 확언 */
export default function Streak() {
  const activity = useActivity();
  const [ty, tm] = activity.today.split('-').map(Number) as [number, number];
  const [view, setView] = useState({ y: ty, m: tm });
  const weeks = monthGrid(view.y, view.m);
  const s = activity.stats;

  const shift = (delta: number) => {
    haptic('light');
    setView((v) => {
      const m = v.m + delta;
      if (m < 1) return { y: v.y - 1, m: 12 };
      if (m > 12) return { y: v.y + 1, m: 1 };
      return { y: v.y, m };
    });
  };

  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <DawnBackdrop
          style={dawnScreen}
          glows={[
            { x: 170, y: -60, width: 260, ...GLOW.pink },
            { x: -110, y: 420, width: 240, ...GLOW.periwinkle },
          ]}
        />
        <SafeAreaView edges={['top', 'bottom']} className="px-gutter pb-6 pt-2">
          <ScreenHeader title={ko.streak.title} />

          <View
            className="mt-6 items-center gap-1 rounded-[28px] border border-glass-border bg-on-photo/70 pb-[22px] pt-[26px]"
            style={shadow.glass}
          >
            <Icon name="flame" size={36} color={tokens.colors.amber} />
            <View className="flex-row items-baseline gap-1">
              <Text className="font-display text-[72px] leading-[84px] text-plum">{s.current}</Text>
              <Text className={`${type.h2} text-plum`}>{ko.streak.days}</Text>
            </View>
            <Text className={`${type.caption} text-ink-soft`}>{ko.streak.hint}</Text>
          </View>

          <View className="mt-4 flex-row gap-[10px]">
            {[
              { label: ko.streak.longest, value: s.longest },
              { label: ko.streak.thisMonth, value: s.thisMonth },
              { label: ko.streak.total, value: s.total },
            ].map((stat) => (
              <View
                key={stat.label}
                accessible
                accessibilityLabel={`${stat.label} ${stat.value}`}
                className="flex-1 items-center rounded-[18px] border border-glass-border bg-glass py-3"
                style={shadow.glass}
              >
                <Text className="font-display text-[28px] leading-[34px] text-plum">
                  {stat.value}
                </Text>
                <Text className={`${type.caption} text-ink-soft`}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View
            className="mt-5 gap-[10px] rounded-[24px] border border-glass-border bg-glass px-4 pb-[18px] pt-4"
            style={shadow.glass}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={ko.streak.prevMonth}
                  hitSlop={8}
                  onPress={() => shift(-1)}
                >
                  <Icon name="back" size={16} color={tokens.colors['ink-soft']} />
                </Pressable>
                <Text className={`${type.bodyMedium} text-plum-deep`}>
                  {ko.streak.month(view.y, view.m)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={ko.streak.nextMonth}
                  hitSlop={8}
                  onPress={() => shift(1)}
                >
                  <Icon name="chevronRow" size={16} color={tokens.colors['ink-soft']} />
                </Pressable>
              </View>
              <Text className={`${type.caption} text-ink-faint`}>{ko.streak.legend}</Text>
            </View>
            <View className="flex-row justify-between">
              {ko.streak.weekdays.map((w) => (
                <View key={w} className="h-[18px] w-9 items-center">
                  <Text className={`${type.caption} text-ink-faint`}>{w}</Text>
                </View>
              ))}
            </View>
            {weeks.map((week, wi) => (
              <View key={wi} className="flex-row justify-between">
                {week.map((d, di) => {
                  if (d === null) return <View key={di} className="h-9 w-9" />;
                  const day = `${view.y}-${pad(view.m)}-${pad(d)}`;
                  const isToday = day === activity.today;
                  const future = day > activity.today;
                  const done = activity.recorded.has(day);
                  return (
                    <View
                      key={di}
                      accessible
                      accessibilityLabel={day}
                      accessibilityState={{ checked: done }}
                      className={`h-9 w-9 items-center justify-center rounded-full ${
                        isToday ? 'border-[1.5px] border-plum' : ''
                      }`}
                      style={done ? recordedCell : undefined}
                    >
                      {done ? (
                        <GoldCrescent size={18} />
                      ) : (
                        <Text
                          className={`font-display text-[17px] ${
                            future ? 'text-plum-deep/35' : 'text-plum-deep/70'
                          }`}
                        >
                          {d}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          <View className="mt-5">
            <PrimaryButton label={ko.streak.cta} onPress={() => router.navigate('/affirmations')} />
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
