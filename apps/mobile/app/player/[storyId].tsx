import { canPlayStory } from '@eloria/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayer } from '@/audio/player-provider';
import { usePlayerStore } from '@/audio/player-store';
import { paragraphAt, splitParagraphs } from '@/audio/timeline';
import {
  IconButton,
  PlayerControls,
  RepeatToggle,
  SeekBar,
} from '@/features/player/player-controls';
import { SoundscapePanel } from '@/features/player/soundscape-panel';
import { useStory } from '@/features/story/use-story';
import { useStoryAudio } from '@/features/story/use-story-audio';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';

/**
 * 풀 플레이어(PRD F-06, DESIGN 4절). 열면 이 스토리를 재생하고, 닫아도 재생은 이어진다.
 * 표지 이미지(M3)가 생기기 전까지는 dusk 배경만 쓴다. 좋아요·공유·배경 사운드는 이후 작업.
 */
export default function Player() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const story = useStory(storyId);
  const playable = story.data ? canPlayStory(story.data.status) : false;
  const audio = useStoryAudio(storyId, story.data?.kind, playable);
  const { status, playTrack } = usePlayer();
  const current = usePlayerStore((s) => s.track);
  const title = story.data?.title ?? ko.brand.name;
  const [showSoundscape, setShowSoundscape] = useState(false);
  const soundscapeOn = usePlayerStore((s) => Boolean(s.soundscape));

  useEffect(() => {
    if (audio.data && current?.storyId !== storyId) {
      playTrack({ storyId, title }, audio.data.url);
    }
  }, [audio.data, current?.storyId, storyId, title, playTrack]);

  const paragraphs = useMemo(() => splitParagraphs(story.data?.script ?? ''), [story.data?.script]);
  const isThisTrack = current?.storyId === storyId;
  const subtitle = isThisTrack
    ? paragraphs[paragraphAt(paragraphs, status.currentTime, status.duration)]
    : paragraphs[0];

  const notice =
    story.data && !playable ? ko.player.notReady : audio.isError ? ko.player.loadFailed : undefined;

  return (
    <View className="flex-1 bg-dusk">
      <SafeAreaView className="flex-1 justify-between px-gutter pb-4">
        <View className="h-12 flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ko.player.close}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <SymbolView
              name={{ ios: 'chevron.down', android: 'keyboard_arrow_down' }}
              size={28}
              tintColor={tokens.colors['on-dusk']}
            />
          </Pressable>
          <View className="items-center">
            <Text className="text-[16px] text-on-dusk">{ko.brand.name}</Text>
            <Text className="text-[10px] tracking-[3px] text-on-dusk/70">{ko.brand.tagline}</Text>
          </View>
          <View className="w-7" />
        </View>

        <View className="flex-1 justify-center gap-6">
          {showSoundscape ? (
            <SoundscapePanel />
          ) : notice ? (
            <Text className="text-center text-[16px] leading-[24px] text-on-dusk/80">{notice}</Text>
          ) : !isThisTrack || !status.isLoaded ? (
            <ActivityIndicator color={tokens.colors.glow} />
          ) : (
            <Text
              accessibilityLiveRegion="polite"
              className="text-[26px] leading-[36px] text-on-dusk"
            >
              {subtitle}
            </Text>
          )}
          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={ko.player.fullText}
              onPress={() =>
                router.push({ pathname: '/story/[storyId]/text', params: { storyId } })
              }
              className="flex-row items-center gap-2 self-start rounded-full bg-on-dusk/15 px-4 py-2"
            >
              <SymbolView
                name={{ ios: 'book', android: 'menu_book' }}
                size={16}
                tintColor={tokens.colors['on-dusk']}
              />
              <Text className="text-[13px] text-on-dusk">{ko.player.fullText}</Text>
            </Pressable>
            <View className="flex-row">
              <IconButton
                icon={{ ios: 'waveform', android: 'graphic_eq' }}
                label={ko.player.soundscape}
                active={showSoundscape || soundscapeOn}
                size={22}
                onPress={() => setShowSoundscape((v) => !v)}
              />
              <RepeatToggle />
            </View>
          </View>
        </View>

        <View className="gap-6">
          <Text className="text-[13px] text-on-dusk/80">{title}</Text>
          <SeekBar />
          <PlayerControls storyId={storyId} />
        </View>
      </SafeAreaView>
    </View>
  );
}
