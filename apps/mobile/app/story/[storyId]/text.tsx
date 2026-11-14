import { canReadStory } from '@eloria/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayer } from '@/audio/player-provider';
import { usePlayerStore } from '@/audio/player-store';
import { paragraphAt, subtitleLines } from '@/audio/timeline';
import { RoundButton } from '@/components/ui';
import { useStory } from '@/features/story/use-story';
import { ko } from '@/i18n/ko';
import { dawnScreen } from '@/theme/effects';
import { storyCover } from '@/theme/images';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

/**
 * 전체 이야기(Figma H08 시트형 가사). 안전 검수를 통과한 text_ready 이후에만 본문을 보여 준다.
 * 이 이야기를 재생 중이면 지금 읽는 문장을 진하게, 나머지는 옅게 보여 준다.
 */
export default function StoryText() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const story = useStory(storyId);
  const readable = story.data && canReadStory(story.data.status) && story.data.script;
  const { status } = usePlayer();
  const playing = usePlayerStore((s) => s.track?.storyId === storyId);
  const lines = useMemo(() => subtitleLines(story.data?.script ?? ''), [story.data?.script]);
  const currentIndex = playing ? paragraphAt(lines, status.currentTime, status.duration) : -1;

  return (
    <View className="flex-1" style={dawnScreen}>
      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <View className="items-center pt-3">
          <View className="h-1 w-9 rounded-full bg-plum-deep/20" />
        </View>
        <View className="flex-row items-center gap-3 px-gutter pb-2 pt-4">
          <Image source={storyCover(storyId, story.data?.imageHint)} className="h-11 w-11 rounded-xl" />
          <View className="flex-1">
            <Text className={`${type.labelSmall} text-plum`}>{ko.story.fullText}</Text>
            <Text numberOfLines={1} className={`${type.bodyMedium} text-plum-deep`}>
              {story.data?.title ?? ko.stories.untitled}
            </Text>
          </View>
          <RoundButton icon="close" label={ko.story.back} onPress={() => router.back()} />
        </View>

        {!readable ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={tokens.colors.plum} />
          </View>
        ) : (
          <ScrollView contentContainerClassName="gap-3 px-gutter pb-12 pt-4">
            {lines.map((p, i) => (
              <Text
                key={i}
                className={`font-serif text-[22px] leading-[34px] tracking-[-0.22px] ${
                  currentIndex === -1 || currentIndex === i ? 'text-plum-deep' : 'text-plum-deep/40'
                }`}
              >
                {p}
              </Text>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
