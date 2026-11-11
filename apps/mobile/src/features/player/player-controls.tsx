import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { usePlayer } from '@/audio/player-provider';
import { formatTime } from '@/audio/timeline';
import { Icon, type IconName } from '@/components/icons/icon';
import { FavoriteButton } from '@/features/library/favorite-button';
import { ko } from '@/i18n/ko';
import { shadow } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

export function IconButton({
  icon,
  label,
  onPress,
  size = 26,
  active = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  size?: number;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={8}
      className="h-12 w-12 items-center justify-center"
    >
      <Icon
        name={icon}
        size={size}
        color={active ? tokens.colors.amber : tokens.colors['on-photo']}
      />
    </Pressable>
  );
}

/** 진행 바(3px, 흰 손잡이)와 경과/남은 시간. 누른 위치로 이동한다. */
export function SeekBar() {
  const { status, player } = usePlayer();
  const [width, setWidth] = useState(0);
  const progress = status.duration > 0 ? Math.min(status.currentTime / status.duration, 1) : 0;

  return (
    <View className="gap-2">
      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel={ko.player.seek}
        accessibilityValue={{
          min: 0,
          max: Math.round(status.duration),
          now: Math.round(status.currentTime),
          text: formatTime(status.currentTime),
        }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onPress={(e) => {
          if (width > 0 && status.duration > 0) {
            void player.seekTo((e.nativeEvent.locationX / width) * status.duration);
          }
        }}
        className="h-6 justify-center"
      >
        <View className="h-[3px] rounded-[2px] bg-on-photo/25">
          <View
            className="h-[3px] rounded-[2px] bg-on-photo"
            style={{ width: `${progress * 100}%` }}
          />
        </View>
        <View
          className="absolute h-3 w-3 rounded-full bg-on-photo"
          style={{ left: Math.max(0, progress * width - 6) }}
        />
      </Pressable>
      <View className="flex-row justify-between">
        <Text className={`${type.caption} text-on-photo/75`}>{formatTime(status.currentTime)}</Text>
        <Text className={`${type.caption} text-on-photo/75`}>
          {ko.player.remaining(formatTime(Math.max(0, status.duration - status.currentTime)))}
        </Text>
      </View>
    </View>
  );
}

/** 컨트롤(Figma H07): 좋아요 · 10초 되감기 · 재생/일시정지(흰 원) · 10초 앞으로 · 배경음 */
export function PlayerControls({
  storyId,
  soundscapeActive,
  onSoundscape,
}: {
  storyId: string;
  soundscapeActive: boolean;
  onSoundscape: () => void;
}) {
  const { status, togglePlay, seekBy } = usePlayer();
  const playing = status.playing;

  return (
    <View className="flex-row items-center justify-between">
      <FavoriteButton
        storyId={storyId}
        color={tokens.colors['on-photo']}
        activeColor={tokens.colors['on-photo']}
        size={24}
      />
      <IconButton icon="back10" label={ko.player.back10} onPress={() => seekBy(-10)} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? ko.player.pause : ko.player.play}
        onPress={togglePlay}
        className="h-[72px] w-[72px] items-center justify-center rounded-full bg-pearl"
        style={shadow.playLarge}
      >
        <Icon name={playing ? 'pause' : 'play'} size={28} color={tokens.colors['plum-deep']} />
      </Pressable>
      <IconButton icon="forward10" label={ko.player.forward10} onPress={() => seekBy(10)} />
      <IconButton
        icon="music"
        label={ko.player.soundscape}
        size={24}
        active={soundscapeActive}
        onPress={onSoundscape}
      />
    </View>
  );
}

/** 반복 토글(Figma: 다음 문장 줄 오른쪽의 유리 원) */
export function RepeatToggle() {
  const { status, player } = usePlayer();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={ko.player.repeat}
      accessibilityState={{ selected: status.loop }}
      onPress={() => {
        player.loop = !player.loop;
      }}
      hitSlop={6}
      className={`h-9 w-9 items-center justify-center rounded-full border ${
        status.loop ? 'border-on-photo bg-on-photo/40' : 'border-on-photo/40 bg-on-photo/15'
      }`}
    >
      <Icon name="repeat" size={16} color={tokens.colors['on-photo']} />
    </Pressable>
  );
}
