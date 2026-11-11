import type { LibraryCategory } from '@eloria/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DawnBackdrop, GLOW } from '@/components/backgrounds';
import { PrimaryButton } from '@/components/primary-button';
import { FilterChip, SectionHeader } from '@/components/ui';
import { useFavorites } from '@/features/library/use-library';
import { useBottomSpace } from '@/features/navigation/tab-bar';
import { groupRituals } from '@/features/rituals/group-rituals';
import { FeatureCard, TrackCard, TrackRow } from '@/features/rituals/track-cards';
import { useRituals } from '@/features/rituals/use-rituals';
import { ko } from '@/i18n/ko';
import { dawnScreenLong } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

type Filter = 'all' | 'saved' | LibraryCategory;

/**
 * 라이브러리(Figma L01, PRD F-10): 운영자가 미리 만든 공용 콘텐츠. 대표 카드 → 카테고리별 가로 캐러셀.
 * 칩으로 한 카테고리(세로 목록)나 저장한 것만 볼 수 있다. Figma의 확언·주파수·수면·노래·소원 테마는
 * 콘텐츠가 준비되면 같은 틀에 섹션으로 더한다(ROADMAP).
 */
export default function Library() {
  const rituals = useRituals();
  const favorites = useFavorites();
  const bottom = useBottomSpace();
  const [filter, setFilter] = useState<Filter>('all');

  // 시드가 새로 완성되면 보이도록 탭에 들어올 때 다시 읽는다(staleTime 안이면 캐시를 쓴다).
  useFocusEffect(
    useCallback(() => {
      if (rituals.isStale) void rituals.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- 포커스마다 한 번만 확인한다.
    }, []),
  );

  const all = useMemo(() => groupRituals(rituals.data ?? []), [rituals.data]);
  const items = useMemo(() => {
    const list = all.flatMap((s) => s.data);
    if (filter === 'all') return list;
    if (filter === 'saved') return list.filter((i) => favorites.data?.has(i.storyId));
    return list.filter((i) => i.category === filter);
  }, [all, filter, favorites.data]);
  const feature = all[0]?.data[0];

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom, flexGrow: 1 }}
      >
        <DawnBackdrop
          style={dawnScreenLong}
          glows={[
            { x: 170, y: -60, width: 260, ...GLOW.pinkWide },
            { x: -110, y: 460, width: 260, ...GLOW.periwinkleWide },
            { x: 170, y: 980, width: 260, ...GLOW.pinkWide },
            { x: -110, y: 1500, width: 260, ...GLOW.periwinkleWide },
            { x: 170, y: 2020, width: 260, ...GLOW.pinkWide },
          ]}
        />
        <SafeAreaView edges={['top']} className="px-gutter pt-2">
          <Text accessibilityRole="header" className={`${type.h1} text-plum-deep`}>
            {ko.library.title}
          </Text>
        </SafeAreaView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityRole="tablist"
          className="mt-[14px] shrink-0 grow-0"
          contentContainerClassName="gap-2 px-gutter"
        >
          <FilterChip
            label={ko.library.all}
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <FilterChip
            label={ko.stories.liked}
            selected={filter === 'saved'}
            onPress={() => setFilter('saved')}
          />
          {all.map((s) => (
            <FilterChip
              key={s.category}
              label={ko.library.categories[s.category]}
              selected={filter === s.category}
              onPress={() => setFilter(s.category)}
            />
          ))}
        </ScrollView>

        {rituals.isPending ? (
          <View className="flex-1 items-center justify-center pt-24">
            <ActivityIndicator color={tokens.colors.plum} />
          </View>
        ) : rituals.isError ? (
          <View className="px-gutter pt-24">
            <PrimaryButton label={ko.common.retry} onPress={() => rituals.refetch()} />
          </View>
        ) : all.length === 0 ? (
          <Text className={`${type.body} px-gutter pt-24 text-center text-ink-soft`}>
            {ko.library.empty}
          </Text>
        ) : filter === 'all' ? (
          <>
            {feature && (
              <View className="mt-[18px] items-center">
                <FeatureCard item={feature} />
              </View>
            )}
            {all.map((section) => (
              <View key={section.category} className="mt-8">
                <View className="px-gutter">
                  <SectionHeader
                    title={ko.library.categories[section.category]}
                    onSeeAll={() => setFilter(section.category)}
                  />
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mt-[14px] shrink-0 grow-0"
                  contentContainerClassName="gap-[14px] px-gutter pb-4"
                >
                  {section.data.map((item, i) => (
                    <TrackCard key={item.storyId} item={item} index={i} />
                  ))}
                </ScrollView>
              </View>
            ))}
          </>
        ) : (
          <View className="mt-[18px] gap-3 px-gutter">
            {items.length === 0 ? (
              <Text className={`${type.body} pt-16 text-center text-ink-soft`}>
                {ko.stories.emptyLiked}
              </Text>
            ) : (
              items.map((item, i) => <TrackRow key={item.storyId} item={item} index={i} />)
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
