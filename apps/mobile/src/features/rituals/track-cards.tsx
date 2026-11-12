import type { ReactNode } from 'react';
import { LIBRARY_ACCESS } from '@eloria/shared';
import { usePlayerStore } from '@/audio/player-store';
import { router } from 'expo-router';
import { Image, type ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/icons/icon';
import { durationLabel } from '@/features/library/labels';
import { ko } from '@/i18n/ko';
import { cardOverlay, shadow } from '@/theme/effects';
import { libraryFeatureImage, libraryItemImage, songImages, wishThemeImage } from '@/theme/images';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';
import type { RitualItem, WishBundle } from './group-rituals';
import { haptic } from '@/lib/haptics';

const titleShadow = {
  textShadowColor: 'rgba(46,33,64,0.35)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 10,
};

/**
 * 잠금(페이월이 켜졌을 때만, 판단은 서버)이면 페이월로, 아니면 플레이어로.
 * 하나를 고르면 묶음 이어 듣기 대기열은 비운다. 주파수는 반복 재생으로 시작한다(Figma L01 노트).
 */
export function openItem(item: RitualItem, queue: RitualItem[] = []) {
  haptic('medium');
  if (LIBRARY_ACCESS.PAYWALL_ENABLED && !item.isFree) return router.push('/paywall');
  usePlayerStore
    .getState()
    .setQueue(queue.map((q) => ({ storyId: q.storyId, title: q.title ?? ko.brand.name })));
  router.push({
    pathname: '/player/[storyId]',
    params: { storyId: item.storyId, ...(item.category === 'frequency' && { loop: '1' }) },
  });
}

/** 소원 묶음 전체 이어 듣기: 첫 곡을 열고 나머지를 대기열에 둔다(L06 순서). */
export function playBundle(bundle: WishBundle) {
  const [first, ...rest] = bundle.data;
  if (first) openItem(first, rest);
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
      source={libraryItemImage(item, index)}
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

/** 세로 목록 한 줄(Figma Library / List Row). accent = 소원 묶음(L06) 행: 보라 재생 버튼 */
export function TrackRow({
  item,
  index,
  accent = false,
  onPress,
}: {
  item: RitualItem;
  index: number;
  accent?: boolean;
  onPress?: () => void;
}) {
  const title = item.title ?? ko.stories.untitled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={ko.stories.openStory(title)}
      onPress={onPress ?? (() => openItem(item))}
      className="flex-row items-center gap-[14px] rounded-[22px] border border-glass-border bg-glass p-[13px]"
      style={shadow.glass}
    >
      <Image source={libraryItemImage(item, index)} className="h-14 w-14 rounded-[14px]" />
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
      <View
        className={`h-10 w-10 items-center justify-center rounded-full ${accent ? 'bg-plum' : 'bg-plum/10'}`}
      >
        <Icon
          name="play"
          size={16}
          color={accent ? tokens.colors['on-photo'] : tokens.colors.plum}
        />
      </View>
    </Pressable>
  );
}

/** 소원 테마 카드(Figma L01 "Theme Card"): 사진, 묶음 알약, 제목·한 줄, 전체 길이, ▶ = 묶음 이어 듣기 */
export function WishCard({ bundle }: { bundle: WishBundle }) {
  const copy = ko.library.wishThemes[bundle.theme];
  return (
    <PhotoCard
      source={wishThemeImage[bundle.theme]}
      width={200}
      height={260}
      radius={22}
      label={copy.title}
      onPress={() => {
        haptic('light');
        router.push({ pathname: '/wish/[theme]', params: { theme: bundle.theme } });
      }}
    >
      <View className="absolute left-[13px] top-[13px] rounded-full border border-on-photo/45 bg-on-photo/20 px-[10px] py-[5px]">
        <Text className={`${type.caption} text-on-photo`}>{ko.library.wishBundlePill}</Text>
      </View>
      <View className="gap-[6px] p-4">
        <Text numberOfLines={1} className={`${type.h2} text-on-photo`} style={titleShadow}>
          {copy.title}
        </Text>
        <Text numberOfLines={1} className={`${type.caption} text-on-photo/90`} style={titleShadow}>
          {copy.caption}
        </Text>
        <View className="flex-row items-center justify-between">
          <DurationPill sec={bundle.durationSec} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ko.library.playBundle(copy.title)}
            hitSlop={6}
            onPress={() => playBundle(bundle)}
          >
            <PlayDisc size={40} />
          </Pressable>
        </View>
      </View>
    </PhotoCard>
  );
}

/** 끌어당김 노래(Figma L01): 노래 생성 모델이 붙기 전까지 "곧 만나요" 카드 */
export function SongSoonCard({ index }: { index: number }) {
  const title = ko.library.songs[index] ?? ko.library.categories.song;
  return (
    <View
      accessible
      accessibilityLabel={`${title}, ${ko.library.songSoon}`}
      className="justify-end overflow-hidden rounded-[22px] border border-on-photo/60"
      style={[{ width: 200, height: 260 }, shadow.photoCard]}
    >
      <Image
        source={songImages[index % songImages.length]!}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, cardOverlay]} />
      <View className="gap-[10px] p-4">
        <Text numberOfLines={2} className={`${type.h2} text-on-photo`} style={titleShadow}>
          {title}
        </Text>
        <View className="self-start rounded-full border border-on-photo/45 bg-on-photo/20 px-[10px] py-[5px]">
          <Text className={`${type.caption} text-on-photo`}>{ko.library.songSoon}</Text>
        </View>
      </View>
    </View>
  );
}
