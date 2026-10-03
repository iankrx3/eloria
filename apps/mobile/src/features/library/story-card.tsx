import { canPlayStory } from '@eloria/shared';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';
import { FavoriteButton } from './favorite-button';
import type { LibraryStory } from './group-stories';

function durationLabel(sec: number | null) {
  if (!sec) return null;
  return sec >= 60 ? ko.library.minutes(Math.round(sec / 60)) : ko.library.seconds(Math.round(sec));
}

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

/** 라이브러리 스토리 카드. 들을 수 있으면 플레이어로, 만드는 중이면 생성 진행 화면으로 간다. */
export function StoryCard({ story }: { story: LibraryStory }) {
  const playable = canPlayStory(story.status);
  const failed = story.status === 'failed';
  const title = story.title ?? ko.library.untitled;
  const meta = failed
    ? ko.library.failed
    : !playable
      ? ko.library.generating
      : [dateLabel(story.createdAt), durationLabel(story.durationSec)].filter(Boolean).join(' · ');

  const open = () =>
    playable
      ? router.push({ pathname: '/player/[storyId]', params: { storyId: story.id } })
      : router.push({ pathname: '/manifest/[id]/progress', params: { id: story.id } });

  return (
    <View className="flex-row items-center rounded-card bg-surface pl-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ko.library.openStory(title)}
        onPress={open}
        className="flex-1 gap-1 py-4"
      >
        <Text numberOfLines={1} className="text-[16px] text-plum-deep">
          {title}
        </Text>
        <Text className={`text-[13px] ${failed ? 'text-plum' : 'text-ink-muted'}`}>{meta}</Text>
      </Pressable>
      {playable && (
        <FavoriteButton
          storyId={story.id}
          color={tokens.colors['ink-muted']}
          activeColor={tokens.colors.plum}
        />
      )}
    </View>
  );
}
