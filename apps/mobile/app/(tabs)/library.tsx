import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/primary-button';
import { groupByDesire } from '@/features/library/group-stories';
import { StoryCard } from '@/features/library/story-card';
import { useFavorites, useMyStories } from '@/features/library/use-library';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';

type Filter = 'all' | 'liked';

/**
 * 라이브러리(PRD 6절): 내 스토리(꿈별 그룹)와 좋아요.
 * 플레이리스트·다운로드됨은 이후 작업(M5 오프라인, M7 플레이리스트).
 */
export default function Library() {
  const stories = useMyStories();
  const favorites = useFavorites();
  const [filter, setFilter] = useState<Filter>('all');

  // 다른 화면에서 만든 스토리·좋아요가 바로 보이도록 탭에 들어올 때마다 다시 읽는다.
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
    <SafeAreaView edges={['top']} className="flex-1 bg-dawn">
      <View className="gap-4 px-gutter pb-2 pt-4">
        <Text accessibilityRole="header" className="text-[28px] leading-[38px] text-plum-deep">
          {ko.library.title}
        </Text>
        <View accessibilityRole="tablist" className="flex-row gap-2">
          {(['all', 'liked'] as const).map((f) => (
            <Pressable
              key={f}
              accessibilityRole="tab"
              accessibilityState={{ selected: filter === f }}
              onPress={() => setFilter(f)}
              className={`rounded-full px-4 py-2 ${filter === f ? 'bg-plum' : 'bg-surface'}`}
            >
              <Text className={`text-[13px] ${filter === f ? 'text-on-dusk' : 'text-plum-deep'}`}>
                {f === 'all' ? ko.library.all : ko.library.liked}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

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
          contentContainerClassName="gap-3 px-gutter pb-8"
          renderSectionHeader={({ section }) => (
            <Text numberOfLines={1} className="pb-1 pt-4 text-[13px] text-ink-muted">
              {section.title ?? ko.library.otherStories}
            </Text>
          )}
          renderItem={({ item }) => <StoryCard story={item} />}
          ListEmptyComponent={
            <View className="items-center gap-4 pt-16">
              <Text className="text-center text-[16px] leading-[24px] text-ink-muted">
                {filter === 'liked' ? ko.library.emptyLiked : ko.library.empty}
              </Text>
              {filter === 'all' && (
                <PrimaryButton
                  variant="ghost"
                  label={ko.library.goHome}
                  onPress={() => router.navigate('/')}
                />
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
