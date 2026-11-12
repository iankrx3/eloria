import { LIBRARY_SECTIONS, type LibrarySection } from '@eloria/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DawnBackdrop, GLOW } from '@/components/backgrounds';
import { Icon } from '@/components/icons/icon';
import { ScreenHeader } from '@/components/screen-header';
import { FilterChip } from '@/components/ui';
import { durationLabel } from '@/features/library/labels';
import {
  groupRituals,
  groupWishBundles,
  LIBRARY_SORTS,
  sortRituals,
  type LibrarySort,
} from '@/features/rituals/group-rituals';
import { playBundle, TrackRow } from '@/features/rituals/track-cards';
import { useRituals } from '@/features/rituals/use-rituals';
import { ko } from '@/i18n/ko';
import { haptic } from '@/lib/haptics';
import { dawnScreenLong, shadow } from '@/theme/effects';
import { wishThemeImage } from '@/theme/images';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

const t = ko.library;

/**
 * 라이브러리 전체 보기(Figma L04). 정렬: 인기순 / 짧은 순 / 최신순, 행 탭 = 바로 재생.
 * category = wish면 소원 테마 묶음 목록(행 탭 = L06, ▶ = 묶음 이어 듣기).
 */
export default function LibrarySectionScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const rituals = useRituals();
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState<LibrarySort>('popular');
  const section = LIBRARY_SECTIONS.find((c) => c === category) as LibrarySection | undefined;
  const isWish = category === 'wish';

  const items = useMemo(() => {
    if (!section) return [];
    const data = groupRituals(rituals.data ?? [], section)[0]?.data ?? [];
    return sortRituals(data, sort);
  }, [rituals.data, section, sort]);
  const bundles = useMemo(() => groupWishBundles(rituals.data ?? []), [rituals.data]);

  const title = isWish ? t.wishTitle : section ? t.categories[section] : t.title;
  const subtitle = isWish
    ? t.wishSubtitle
    : section
      ? t.sectionCount(items.length, t.taglines[section])
      : '';

  return (
    <View className="flex-1">
      <DawnBackdrop
        style={dawnScreenLong}
        glows={[
          { x: 170, y: -60, width: 260, ...GLOW.pinkWide },
          { x: -110, y: 460, width: 260, ...GLOW.periwinkleWide },
        ]}
      />
      <SafeAreaView edges={['top']} className="px-gutter pt-2">
        <ScreenHeader title={title} />
        <Text className={`${type.caption} mt-[6px] text-plum-deep/60`}>{subtitle}</Text>
        {!isWish && (
          <View accessibilityRole="tablist" className="mt-4 flex-row gap-2">
            {LIBRARY_SORTS.map((s) => (
              <FilterChip
                key={s}
                label={t.sorts[s]}
                selected={sort === s}
                onPress={() => setSort(s)}
              />
            ))}
          </View>
        )}
      </SafeAreaView>

      {rituals.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={tokens.colors.plum} />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-3 px-gutter pt-[18px]"
          contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        >
          {isWish
            ? bundles.map((b) => {
                const copy = t.wishThemes[b.theme];
                return (
                  <Pressable
                    key={b.theme}
                    accessibilityRole="button"
                    accessibilityLabel={copy.title}
                    onPress={() => {
                      haptic('light');
                      router.push({ pathname: '/wish/[theme]', params: { theme: b.theme } });
                    }}
                    className="flex-row items-center gap-[14px] rounded-[22px] border border-glass-border bg-glass p-[13px]"
                    style={shadow.glass}
                  >
                    <Image source={wishThemeImage[b.theme]} className="h-14 w-14 rounded-[14px]" />
                    <View className="flex-1 gap-[3px]">
                      <Text numberOfLines={1} className={`${type.bodyMedium} text-plum-deep`}>
                        {copy.title}
                      </Text>
                      <Text numberOfLines={1} className={`${type.caption} text-ink-soft`}>
                        {[copy.caption, durationLabel(b.durationSec)].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t.playBundle(copy.title)}
                      hitSlop={6}
                      onPress={() => playBundle(b)}
                      className="h-10 w-10 items-center justify-center rounded-full bg-plum"
                    >
                      <Icon name="play" size={16} color={tokens.colors['on-photo']} />
                    </Pressable>
                  </Pressable>
                );
              })
            : items.length === 0
              ? [
                  <Text key="empty" className={`${type.body} pt-16 text-center text-ink-soft`}>
                    {t.emptySection}
                  </Text>,
                ]
              : items.map((item, i) => <TrackRow key={item.storyId} item={item} index={i} />)}
        </ScrollView>
      )}
    </View>
  );
}
