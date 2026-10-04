import type { LibraryCategory } from '@eloria/shared';
import { LIBRARY_CATEGORY } from '@eloria/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, SectionList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/primary-button';
import { groupRituals } from '@/features/rituals/group-rituals';
import { RitualCard } from '@/features/rituals/ritual-card';
import { useRituals } from '@/features/rituals/use-rituals';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';

type Filter = 'all' | LibraryCategory;

/**
 * 리추얼(PRD F-10): 카테고리별 사전 제작 스토리. 확언 스와이프(F-22)·데일리 기록은 이후 작업.
 */
export default function Rituals() {
  const rituals = useRituals();
  const [filter, setFilter] = useState<Filter>('all');

  // 시드가 새로 완성되면 보이도록 탭에 들어올 때 다시 읽는다(staleTime 안이면 캐시를 쓴다).
  useFocusEffect(
    useCallback(() => {
      if (rituals.isStale) void rituals.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- 포커스마다 한 번만 확인한다.
    }, []),
  );

  const sections = useMemo(
    () => groupRituals(rituals.data ?? [], filter === 'all' ? undefined : filter),
    [rituals.data, filter],
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dawn">
      <View className="gap-1 px-gutter pt-4">
        <Text accessibilityRole="header" className="text-[28px] leading-[38px] text-plum-deep">
          {ko.rituals.title}
        </Text>
        <Text className="text-[13px] text-ink-muted">{ko.rituals.subtitle}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        className="shrink-0 grow-0"
        contentContainerClassName="items-center gap-2 px-gutter py-3"
      >
        {(['all', ...LIBRARY_CATEGORY] as const).map((f) => (
          <Pressable
            key={f}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === f }}
            onPress={() => setFilter(f)}
            className={`rounded-full px-4 py-2 ${filter === f ? 'bg-plum' : 'bg-surface'}`}
          >
            <Text className={`text-[13px] ${filter === f ? 'text-on-dusk' : 'text-plum-deep'}`}>
              {f === 'all' ? ko.rituals.all : ko.rituals.categories[f]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {rituals.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={tokens.colors.plum} />
        </View>
      ) : rituals.isError ? (
        <View className="flex-1 justify-center px-gutter">
          <PrimaryButton label={ko.common.retry} onPress={() => rituals.refetch()} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.storyId}
          stickySectionHeadersEnabled={false}
          contentContainerClassName="gap-3 px-gutter pb-8"
          renderSectionHeader={({ section }) =>
            filter === 'all' ? (
              <Text accessibilityRole="header" className="pb-1 pt-4 text-[13px] text-ink-muted">
                {ko.rituals.categories[section.category]}
              </Text>
            ) : null
          }
          renderItem={({ item }) => <RitualCard item={item} />}
          ListEmptyComponent={
            <Text className="pt-16 text-center text-[16px] leading-[24px] text-ink-muted">
              {ko.rituals.empty}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
