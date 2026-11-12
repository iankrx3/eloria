import { LIBRARY_SECTIONS, type LibrarySection } from '@eloria/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DawnBackdrop, GLOW } from '@/components/backgrounds';
import { PrimaryButton } from '@/components/primary-button';
import { FilterChip, RoundButton, SectionHeader } from '@/components/ui';
import { useFavorites } from '@/features/library/use-library';
import { useBottomSpace } from '@/features/navigation/tab-bar';
import { groupRituals, groupWishBundles } from '@/features/rituals/group-rituals';
import {
  FeatureCard,
  SongSoonCard,
  TrackCard,
  TrackRow,
  WishCard,
} from '@/features/rituals/track-cards';
import { useRituals } from '@/features/rituals/use-rituals';
import { ko } from '@/i18n/ko';
import { dawnScreenLong, shadow } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

type Filter = 'all' | 'saved' | LibrarySection;
const t = ko.library;

/** 가로 캐러셀(섹션마다 같은 여백) */
function Carousel({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-[14px] shrink-0 grow-0"
      contentContainerClassName="gap-[14px] px-gutter pb-4"
    >
      {children}
    </ScrollView>
  );
}

/**
 * 라이브러리(Figma L01, PRD F-10): 운영자가 미리 올린 공용 콘텐츠.
 * 대표 카드 → 소원별로 듣기 → 확언 → 주파수 → 명상 → 수면 → 끌어당김 노래(곧 만나요).
 * 칩 = 그 콘텐츠만 세로로, 🔍 = 제목 검색, 섹션 "전체 보기" = L04.
 */
export default function Library() {
  const rituals = useRituals();
  const favorites = useFavorites();
  const bottom = useBottomSpace();
  const [filter, setFilter] = useState<Filter>('all');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  // 시드가 새로 완성되면 보이도록 탭에 들어올 때 다시 읽는다(staleTime 안이면 캐시를 쓴다).
  useFocusEffect(
    useCallback(() => {
      if (rituals.isStale) void rituals.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- 포커스마다 한 번만 확인한다.
    }, []),
  );

  const all = useMemo(() => rituals.data ?? [], [rituals.data]);
  const sections = useMemo(() => groupRituals(all), [all]);
  const bundles = useMemo(() => groupWishBundles(all), [all]);
  const feature = sections[0]?.data[0];

  const q = query.trim();
  const list = useMemo(() => {
    const visible = sections.flatMap((s) => s.data).concat(bundles.flatMap((b) => b.data));
    if (q) return visible.filter((i) => (i.title ?? '').includes(q));
    if (filter === 'saved') return visible.filter((i) => favorites.data?.has(i.storyId));
    if (filter === 'all') return visible;
    return sections.find((s) => s.category === filter)?.data ?? [];
  }, [sections, bundles, filter, favorites.data, q]);

  const seeAll = (category: LibrarySection | 'wish') =>
    router.push({ pathname: '/library-section/[category]', params: { category } });

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
          <View className="flex-row items-center justify-between">
            <Text accessibilityRole="header" className={`${type.h1} text-plum-deep`}>
              {t.title}
            </Text>
            <RoundButton
              icon={searching ? 'close' : 'search'}
              label={searching ? ko.common.close : t.search}
              active={searching}
              onPress={() => {
                setSearching((v) => !v);
                setQuery('');
              }}
            />
          </View>
          {searching && (
            <View className="mt-3 rounded-field" style={shadow.glass}>
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder={t.search}
                placeholderTextColor={tokens.colors['ink-faint']}
                accessibilityLabel={t.search}
                returnKeyType="search"
                className={`${type.body} rounded-field border border-glass-border bg-glass px-[17px] py-3 text-plum-deep`}
              />
            </View>
          )}
        </SafeAreaView>

        {!searching && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            accessibilityRole="tablist"
            className="mt-[14px] shrink-0 grow-0"
            contentContainerClassName="gap-2 px-gutter"
          >
            <FilterChip
              label={t.all}
              selected={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            <FilterChip
              label={t.saved}
              selected={filter === 'saved'}
              onPress={() => setFilter('saved')}
            />
            {LIBRARY_SECTIONS.map((c) => (
              <FilterChip
                key={c}
                label={t.chips[c]}
                selected={filter === c}
                onPress={() => setFilter(c)}
              />
            ))}
          </ScrollView>
        )}

        {rituals.isPending ? (
          <View className="flex-1 items-center justify-center pt-24">
            <ActivityIndicator color={tokens.colors.plum} />
          </View>
        ) : rituals.isError ? (
          <View className="px-gutter pt-24">
            <PrimaryButton label={ko.common.retry} onPress={() => rituals.refetch()} />
          </View>
        ) : sections.length === 0 && bundles.length === 0 ? (
          <Text className={`${type.body} px-gutter pt-24 text-center text-ink-soft`}>
            {t.empty}
          </Text>
        ) : filter === 'all' && !q ? (
          <>
            {feature && (
              <View className="mt-[18px] items-center">
                <FeatureCard item={feature} />
              </View>
            )}

            {bundles.length > 0 && (
              <View className="mt-8">
                <View className="gap-1 px-gutter">
                  <SectionHeader title={t.wishTitle} onSeeAll={() => seeAll('wish')} />
                  <Text className={`${type.caption} text-plum-deep/60`}>{t.wishSubtitle}</Text>
                </View>
                <Carousel>
                  {bundles.map((b) => (
                    <WishCard key={b.theme} bundle={b} />
                  ))}
                </Carousel>
              </View>
            )}

            {LIBRARY_SECTIONS.map((category) => {
              const section = sections.find((s) => s.category === category);
              if (category !== 'song' && !section) return null;
              return (
                <View key={category} className="mt-8">
                  <View className="px-gutter">
                    <SectionHeader
                      title={t.categories[category]}
                      onSeeAll={category === 'song' ? undefined : () => seeAll(category)}
                    />
                  </View>
                  <Carousel>
                    {category === 'song'
                      ? t.songs.map((_, i) => <SongSoonCard key={i} index={i} />)
                      : section!.data.map((item, i) => (
                          <TrackCard key={item.storyId} item={item} index={i} />
                        ))}
                  </Carousel>
                </View>
              );
            })}
          </>
        ) : (
          <View className="mt-[18px] gap-3 px-gutter">
            {filter === 'song' && !q ? (
              <Text className={`${type.body} pt-16 text-center text-ink-soft`}>{t.songSoon}</Text>
            ) : list.length === 0 ? (
              <Text className={`${type.body} pt-16 text-center text-ink-soft`}>
                {filter === 'saved' && !q ? ko.stories.emptyLiked : t.emptySection}
              </Text>
            ) : (
              list.map((item, i) => <TrackRow key={item.storyId} item={item} index={i} />)
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
