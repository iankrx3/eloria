import { LIBRARY_ACCESS } from '@eloria/shared';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View } from 'react-native';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';
import type { RitualItem } from './group-rituals';

function durationLabel(sec: number | null) {
  if (!sec) return null;
  return sec >= 60 ? ko.library.minutes(Math.round(sec / 60)) : ko.library.seconds(Math.round(sec));
}

/** 리추얼 카드. 누르면 플레이어로 간다. 잠금 표시는 페이월(M5)이 켜졌을 때만 보인다(판단은 서버). */
export function RitualCard({ item }: { item: RitualItem }) {
  const title = item.title ?? ko.library.untitled;
  const locked = LIBRARY_ACCESS.PAYWALL_ENABLED && !item.isFree;
  const meta = [ko.rituals.categories[item.category], durationLabel(item.durationSec)]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={ko.library.openStory(title)}
      onPress={() =>
        router.push({ pathname: '/player/[storyId]', params: { storyId: item.storyId } })
      }
      className="flex-row items-center gap-3 rounded-card bg-surface px-4 py-4"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-dawn-2">
        <SymbolView
          name={{
            ios: locked ? 'lock.fill' : 'play.fill',
            android: locked ? 'lock' : 'play_arrow',
          }}
          size={18}
          tintColor={tokens.colors.plum}
        />
      </View>
      <View className="flex-1 gap-1">
        <Text numberOfLines={1} className="text-[16px] text-plum-deep">
          {title}
        </Text>
        <Text className="text-[13px] text-ink-muted">{meta}</Text>
      </View>
    </Pressable>
  );
}
