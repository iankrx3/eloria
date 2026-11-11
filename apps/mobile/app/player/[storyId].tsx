import { canPlayStory } from '@eloria/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayer } from '@/audio/player-provider';
import { usePlayerStore } from '@/audio/player-store';
import { paragraphAt, readCharsInParagraph, splitParagraphs } from '@/audio/timeline';
import { PhotoBackground } from '@/components/backgrounds';
import { GlassPill, RoundButton } from '@/components/ui';
import { PlayerControls, RepeatToggle, SeekBar } from '@/features/player/player-controls';
import { SoundscapePanel } from '@/features/player/soundscape-panel';
import { useStory } from '@/features/story/use-story';
import { useStoryAudio } from '@/features/story/use-story-audio';
import { ko } from '@/i18n/ko';
import { playerOverlay } from '@/theme/effects';
import { storyCover } from '@/theme/images';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

const subtitleShadow = {
  textShadowColor: 'rgba(26,18,38,0.4)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 16,
};

/**
 * 풀 플레이어(Figma H07, PRD F-06). 열면 이 이야기를 재생하고, 닫아도 미니 플레이어로 이어진다.
 * 자막은 문단 단위 근사치다(ElevenLabs 타임스탬프를 받으면 문장 단위로 바꾼다).
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
  const index = isThisTrack ? paragraphAt(paragraphs, status.currentTime, status.duration) : 0;
  const subtitle = paragraphs[index] ?? '';
  // 읽은 부분은 흰색, 아직 읽지 않은 부분은 흰 42%(Figma H07)
  const read = isThisTrack
    ? readCharsInParagraph(paragraphs, index, status.currentTime, status.duration)
    : 0;
  const nextLine = paragraphs[index + 1];

  const notice =
    story.data && !playable ? ko.player.notReady : audio.isError ? ko.player.loadFailed : undefined;

  return (
    <PhotoBackground source={storyCover(storyId)} overlay={playerOverlay}>
      <SafeAreaView className="flex-1 px-gutter pb-5 pt-2">
        <View className="flex-row items-center justify-between">
          <RoundButton
            icon="back"
            label={ko.player.close}
            tone="photo"
            iconSize={20}
            onPress={() => router.back()}
          />
          <Text className="font-display text-[20px] tracking-[2.4px] text-on-photo">
            {ko.brand.name}
          </Text>
          <RoundButton
            icon="settings"
            label={ko.player.soundscape}
            tone="photo"
            active={showSoundscape}
            onPress={() => setShowSoundscape((v) => !v)}
          />
        </View>

        <View className="mt-16 gap-5">
          {notice ? (
            <Text className={`${type.body} text-on-photo/85`}>{notice}</Text>
          ) : !isThisTrack || !status.isLoaded ? (
            <ActivityIndicator color={tokens.colors['on-photo']} />
          ) : (
            <Text
              accessibilityLabel={subtitle}
              numberOfLines={6}
              className={`${type.subtitle} text-on-photo`}
              style={subtitleShadow}
            >
              {subtitle.slice(0, read)}
              <Text className="text-on-photo/40">{subtitle.slice(read)}</Text>
            </Text>
          )}
          <GlassPill
            icon="book"
            label={ko.player.fullText}
            onPress={() => router.push({ pathname: '/story/[storyId]/text', params: { storyId } })}
          />
        </View>

        <View className="flex-1 justify-center">{showSoundscape && <SoundscapePanel />}</View>

        <View className="flex-row items-center gap-3">
          <Text numberOfLines={1} className={`${type.caption} flex-1 text-on-photo/60`}>
            {nextLine ?? title}
          </Text>
          <RepeatToggle />
        </View>
        <View className="mt-[18px]">
          <SeekBar />
        </View>
        <View className="mt-[10px]">
          <PlayerControls
            storyId={storyId}
            soundscapeActive={showSoundscape || soundscapeOn}
            onSoundscape={() => setShowSoundscape((v) => !v)}
          />
        </View>
        <View className="mt-4 flex-row justify-center">
          <GlassPill
            label={ko.player.share}
            onPress={() => void Share.share({ message: `${title} · ${ko.brand.name}` })}
          />
        </View>
      </SafeAreaView>
    </PhotoBackground>
  );
}
