import type { ReactNode } from 'react';
import { LIBRARY_ACCESS } from '@eloria/shared';
import { router } from 'expo-router';
import { Image, type ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/icons/icon';
import { durationLabel } from '@/features/library/labels';
import { ko } from '@/i18n/ko';
import { cardOverlay, shadow } from '@/theme/effects';
import { libraryCover, libraryFeatureImage } from '@/theme/images';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';
import type { RitualItem } from './group-rituals';
import { haptic } from '@/lib/haptics';

const titleShadow = {
  textShadowColor: 'rgba(46,33,64,0.35)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 10,
};

/** 잠금(페이월이 켜졌을 때만, 판단은 서버)이면 페이월로, 아니면 플레이어로 */
function openItem(item: RitualItem) {
  haptic('medium');
  if (LIBRARY_ACCESS.PAYWALL_ENABLED && !item.isFree) return router.push('/paywall');
  router.push({ pathname: '/player/[storyId]', params: { storyId: item.storyId } });
}

function DurationPill({ sec }: { sec: number | null }) {
  const label = durationLabel(sec);
  if (!label) return <View />;
  return (
    <View className="rounded-full border border-on-photo/45 bg-on-photo/20 px-[10px] py-[5px]">
      <Text className={`${type.caption} text-on-photo`}>{label}</Text>
    </View>
  );
}

function PlayDisc({ size }: { size: number }) {
  return (
    <View
      className="items-center justify-center rounded-full bg-on-photo"
      style={[{ width: size, height: size }, shadow.playKnob]}
    >
      <Icon name="play" size={size * 0.4} color={tokens.colors['plum-deep']} />
    </View>
  );
}

function PhotoCard({
  source,
  width,
  height,
  radius,
  children,
  onPress,
  label,
}: {
  source: ImageSourcePropType;
  width: number;
  height: number;
  radius: number;
  children: ReactNode;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="justify-end overflow-hidden border border-on-photo/60"
      style={[{ width, height, borderRadius: radius }, shadow.photoCard]}
    >
      <Image source={source} resizeMode="cover" style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, cardOverlay]} />
      {children}
    </Pressable>
  );
}

/** 대표 카드(Figma Library / Feature Card 312×300) */
export function FeatureCard({ item }: { item: RitualItem }) {
  const title = item.title ?? ko.stories.untitled;
  return (
    <PhotoCard
      source={libraryFeatureImage}
      width={312}
      height={300}
      radius={28}
      label={ko.stories.openStory(title)}
      onPress={() => openItem(item)}
    >
      <View className="gap-[10px] px-5 pb-5 pt-4">
        <Text className={`${type.label} text-on-photo/90`}>{ko.library.trending}</Text>
        <Text numberOfLines={2} className={`${type.h1} text-on-photo`} style={titleShadow}>
          {title}
        </Text>
        <View className="flex-row items-center justify-between">
          <DurationPill sec={item.durationSec} />
          <PlayDisc size={52} />
        </View>
      </View>
    </PhotoCard>
  );
}

/** 가로 캐러셀 카드(Figma Library / Track Card 200×260) */
export function TrackCard({ item, index }: { item: RitualItem; index: number }) {
  const title = item.title ?? ko.stories.untitled;
  return (
    <PhotoCard
      source={libraryCover(item.category, index)}
      width={200}
      height={260}
      radius={22}
      label={ko.stories.openStory(title)}
      onPress={() => openItem(item)}
    >
      <View className="gap-[10px] p-4">
        <Text numberOfLines={2} className={`${type.h2} text-on-photo`} style={titleShadow}>
          {title}
        </Text>
        <View className="flex-row items-center justify-between">
          <DurationPill sec={item.durationSec} />
          <PlayDisc size={40} />
        </View>
      </View>
    </PhotoCard>
  );
}

/** 세로 목록 한 줄(Figma Library / List Row) */
export function TrackRow({ item, index }: { item: RitualItem; index: number }) {
  const title = item.title ?? ko.stories.untitled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={ko.stories.openStory(title)}
      onPress={() => openItem(item)}
      className="flex-row items-center gap-[14px] rounded-[22px] border border-glass-border bg-glass p-[13px]"
      style={shadow.glass}
    >
      <Image source={libraryCover(item.category, index)} className="h-14 w-14 rounded-[14px]" />
      <View className="flex-1 gap-[3px]">
        <Text numberOfLines={1} className={`${type.bodyMedium} text-plum-deep`}>
          {title}
        </Text>
        <Text className={`${type.caption} text-ink-soft`}>
          {[ko.library.categories[item.category], durationLabel(item.durationSec)]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
      <View className="h-10 w-10 items-center justify-center rounded-full bg-plum/10">
        <Icon name="play" size={16} color={tokens.colors.plum} />
      </View>
    </Pressable>
  );
}
