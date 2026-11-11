import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, SectionList, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DawnBackdrop, GLOW } from '@/components/backgrounds';
import { PrimaryButton } from '@/components/primary-button';
import { FilterChip, RoundButton } from '@/components/ui';
import { groupByDesire } from '@/features/library/group-stories';
import { StoryCard } from '@/features/library/story-card';
import { useFavorites, useMyStories } from '@/features/library/use-library';
import { ko } from '@/i18n/ko';
import { dawnScreenLong } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

type Filter = 'all' | 'liked';

/**
 * 저장한 이야기(PRD 6절 내 스토리): 꿈별 묶음과 좋아요. 홈 "전체 보기", 마이페이지 "저장한 이야기·콘텐츠"에서 연다.
 * 플레이리스트·다운로드됨은 이후 작업(M5 오프라인, M7 플레이리스트).
 */
export default function Stories() {
  const stories = useMyStories();
  const favorites = useFavorites();
  const bottom = useSafeAreaInsets().bottom + 24;
  const [filter, setFilter] = useState<Filter>('all');

  // 다른 화면에서 만든 이야기·좋아요가 바로 보이도록 들어올 때마다 다시 읽는다.
  useFocusEffect(
    useCallback(() => {
      void stories.refetch();
      void favorites.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch 함수는 안정적이며 포커스마다 한 번만 부른다.
    }, []),
  );

  const sections = useMemo(() => {
    const list = stories.data ?? [];
    const visible = filter === 'liked' ? list.filter((s) => favorites.data?.has(s.id)) : list;
    return groupByDesire(visible);
  }, [stories.data, favorites.data, filter]);

  return (
    <View className="flex-1">
      <DawnBackdrop
        style={dawnScreenLong}
        glows={[
          { x: 170, y: -60, width: 260, ...GLOW.pinkWide },
          { x: -110, y: 460, width: 260, ...GLOW.periwinkleWide },
        ]}
      />
      <SafeAreaView edges={['top']} className="gap-4 px-gutter pb-2 pt-2">
        <View className="flex-row items-center gap-[10px]">
          <RoundButton icon="back" label={ko.common.back} onPress={() => router.back()} />
          <Text accessibilityRole="header" className={`${type.h1} text-plum-deep`}>
            {ko.stories.title}
          </Text>
        </View>
        <View accessibilityRole="tablist" className="flex-row gap-2">
          <FilterChip
            label={ko.stories.all}
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <FilterChip
            label={ko.stories.liked}
            selected={filter === 'liked'}
            onPress={() => setFilter('liked')}
          />
        </View>
      </SafeAreaView>

      {stories.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={tokens.colors.plum} />
        </View>
      ) : stories.isError ? (
        <View className="flex-1 justify-center px-gutter">
          <PrimaryButton label={ko.common.retry} onPress={() => stories.refetch()} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerClassName="gap-3 px-gutter"
          contentContainerStyle={{ paddingBottom: bottom }}
          renderSectionHeader={({ section }) => (
            <Text numberOfLines={1} className={`${type.caption} pb-1 pt-4 text-plum/85`}>
              {section.title ?? ko.stories.otherStories}
            </Text>
          )}
          renderItem={({ item }) => <StoryCard story={item} />}
          ListEmptyComponent={
            <View className="items-center gap-4 pt-16">
              <Text className={`${type.body} text-center text-ink-soft`}>
                {filter === 'liked' ? ko.stories.emptyLiked : ko.stories.empty}
              </Text>
              {filter === 'all' && (
                <PrimaryButton
                  variant="ghost"
                  label={ko.stories.goHome}
                  onPress={() => router.navigate('/')}
                />
              )}
            </View>
          }
        />
      )}
    </View>
  );
}
