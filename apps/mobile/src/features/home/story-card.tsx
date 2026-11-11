import { canPlayStory } from '@eloria/shared';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/icons/icon';
import { FavoriteButton } from '@/features/library/favorite-button';
import type { LibraryStory } from '@/features/library/group-stories';
import { durationLabel } from '@/features/library/labels';
import { ko } from '@/i18n/ko';
import { photoTextSoft, shadow, storyCardOverlay } from '@/theme/effects';
import { storyCover } from '@/theme/images';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';
import { haptic } from '@/lib/haptics';

/** 홈 "당신을 위한 이야기" 카드(Figma Home / Story Card 260×340). 누르면 플레이어, 만드는 중이면 진행 화면 */
export function HomeStoryCard({ story }: { story: LibraryStory }) {
  const playable = canPlayStory(story.status);
  const title = story.title ?? ko.stories.untitled;
  const pill =
    story.status === 'failed'
      ? ko.stories.failed
      : playable
        ? durationLabel(story.durationSec)
        : ko.stories.generating;

  const open = () => {
    haptic('light');
    return playable
      ? router.push({ pathname: '/player/[storyId]', params: { storyId: story.id } })
      : router.push({ pathname: '/manifest/[id]/progress', params: { id: story.id } });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={ko.stories.openStory(title)}
      onPress={open}
      className="h-[340px] w-[260px] overflow-hidden rounded-[24px]"
      style={shadow.storyCard}
    >
      <Image source={storyCover(story.id)} resizeMode="cover" style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, storyCardOverlay]} />

      {playable && (
        <View className="absolute right-3 top-3 h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-on-photo/50 bg-on-photo/25">
          <FavoriteButton
            storyId={story.id}
            color={tokens.colors['on-photo']}
            activeColor={tokens.colors['on-photo']}
            size={18}
          />
        </View>
      )}

      <Text
        numberOfLines={2}
        className={`${type.h2} absolute left-5 right-4 top-[188px] text-on-photo`}
        style={photoTextSoft}
      >
        {title}
      </Text>

      {pill && (
        <View className="absolute bottom-[22px] left-5 rounded-full bg-on-photo/25 px-[10px] py-1">
          <Text className={`${type.caption} text-on-photo`}>{pill}</Text>
        </View>
      )}
      {playable && (
        <View className="absolute bottom-[14px] right-5 h-[46px] w-[46px] items-center justify-center rounded-full bg-pearl">
          <Icon name="play" size={20} color={tokens.colors['plum-deep']} />
        </View>
      )}
    </Pressable>
  );
}
