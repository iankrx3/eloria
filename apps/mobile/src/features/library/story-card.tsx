import { canPlayStory } from '@eloria/shared';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Alert, Pressable, Text, View } from 'react-native';
import { usePlayer } from '@/audio/player-provider';
import { ko } from '@/i18n/ko';
import { ApiClientError } from '@/lib/api-client';
import tokens from '@/theme/tokens.json';
import { FavoriteButton } from './favorite-button';
import { canDeleteStory, type LibraryStory } from './group-stories';
import { useDeleteStory } from './use-library';

function durationLabel(sec: number | null) {
  if (!sec) return null;
  return sec >= 60 ? ko.library.minutes(Math.round(sec / 60)) : ko.library.seconds(Math.round(sec));
}

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

/** 라이브러리 스토리 카드. 들을 수 있으면 플레이어로, 만드는 중이면 생성 진행 화면으로 간다. */
export function StoryCard({ story }: { story: LibraryStory }) {
  const remove = useDeleteStory();
  const { unloadIfCurrent } = usePlayer();
  const playable = canPlayStory(story.status);
  const failed = story.status === 'failed';
  const deletable = canDeleteStory(story.status, story.errorCode);
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

  const confirmDelete = () =>
    Alert.alert(ko.library.deleteTitle, ko.library.deleteBody, [
      { text: ko.library.deleteCancel, style: 'cancel' },
      {
        text: ko.library.deleteConfirm,
        style: 'destructive',
        onPress: () => {
          // 재생 중인 스토리면 먼저 내려서 지워진 파일을 계속 재생하지 않게 한다.
          unloadIfCurrent(story.id);
          remove.mutate(story.id, {
            onError: (e) =>
              Alert.alert(
                e instanceof ApiClientError && e.code === 'CONFLICT'
                  ? ko.library.deleteBusy
                  : ko.library.deleteFailed,
              ),
          });
        },
      },
    ]);

  return (
    <View
      className={`flex-row items-center rounded-card bg-surface pl-4 ${remove.isPending ? 'opacity-50' : ''}`}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ko.library.openStory(title)}
        onPress={open}
        disabled={remove.isPending}
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
      {deletable && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ko.library.more(title)}
          hitSlop={8}
          disabled={remove.isPending}
          onPress={confirmDelete}
          className="h-12 w-11 items-center justify-center"
        >
          <SymbolView
            name={{ ios: 'ellipsis', android: 'more_horiz' }}
            size={20}
            tintColor={tokens.colors['ink-muted']}
          />
        </Pressable>
      )}
    </View>
  );
}
