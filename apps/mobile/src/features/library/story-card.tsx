import { canPlayStory } from '@eloria/shared';
import { router } from 'expo-router';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { usePlayer } from '@/audio/player-provider';
import { Icon } from '@/components/icons/icon';
import { ko } from '@/i18n/ko';
import { ApiClientError } from '@/lib/api-client';
import { shadow } from '@/theme/effects';
import { storyCover } from '@/theme/images';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';
import { FavoriteButton } from './favorite-button';
import { canDeleteStory, type LibraryStory } from './group-stories';
import { dateLabel, durationLabel } from './labels';
import { useDeleteStory } from './use-library';
import { haptic } from '@/lib/haptics';

/** 저장한 이야기 한 줄(Figma Library / List Row 모양). 들을 수 있으면 플레이어로, 만드는 중이면 생성 진행 화면으로 간다. */
export function StoryCard({ story }: { story: LibraryStory }) {
  const remove = useDeleteStory();
  const { unloadIfCurrent } = usePlayer();
  const playable = canPlayStory(story.status);
  const failed = story.status === 'failed';
  const deletable = canDeleteStory(story.status, story.errorCode);
  const title = story.title ?? ko.stories.untitled;
  const meta = failed
    ? ko.stories.failed
    : !playable
      ? ko.stories.generating
      : [dateLabel(story.createdAt), durationLabel(story.durationSec)].filter(Boolean).join(' · ');

  const open = () => {
    haptic('light');
    return playable
      ? router.push({ pathname: '/player/[storyId]', params: { storyId: story.id } })
      : router.push({ pathname: '/manifest/[id]/progress', params: { id: story.id } });
  };

  const confirmDelete = () => {
    haptic('warning');
    Alert.alert(ko.stories.deleteTitle, ko.stories.deleteBody, [
      { text: ko.stories.deleteCancel, style: 'cancel' },
      {
        text: ko.stories.deleteConfirm,
        style: 'destructive',
        onPress: () => {
          // 재생 중인 스토리면 먼저 내려서 지워진 파일을 계속 재생하지 않게 한다.
          unloadIfCurrent(story.id);
          remove.mutate(story.id, {
            onError: (e) =>
              Alert.alert(
                e instanceof ApiClientError && e.code === 'CONFLICT'
                  ? ko.stories.deleteBusy
                  : ko.stories.deleteFailed,
              ),
          });
        },
      },
    ]);
  };

  return (
    <View
      className={`flex-row items-center gap-3 rounded-[22px] border border-glass-border bg-glass py-[13px] pl-[13px] ${remove.isPending ? 'opacity-50' : ''}`}
      style={shadow.glass}
    >
      <Image source={storyCover(story.id, story.imageHint)} className="h-14 w-14 rounded-[14px]" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ko.stories.openStory(title)}
        onPress={open}
        disabled={remove.isPending}
        className="flex-1 gap-[3px] py-1"
      >
        <Text numberOfLines={1} className={`${type.bodyMedium} text-plum-deep`}>
          {title}
        </Text>
        <Text className={`${type.caption} ${failed ? 'text-plum' : 'text-ink-soft'}`}>{meta}</Text>
      </Pressable>
      {playable && (
        <FavoriteButton
          storyId={story.id}
          color={tokens.colors['ink-soft']}
          activeColor={tokens.colors.plum}
        />
      )}
      {deletable && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ko.stories.more(title)}
          hitSlop={8}
          disabled={remove.isPending}
          onPress={confirmDelete}
          className="h-12 w-11 items-center justify-center"
        >
          <Icon name="remove" size={16} color={tokens.colors['ink-soft']} />
        </Pressable>
      )}
    </View>
  );
}
