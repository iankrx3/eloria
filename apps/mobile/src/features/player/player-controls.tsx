import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { usePlayer } from '@/audio/player-provider';
import { FavoriteButton } from '@/features/library/favorite-button';
import { formatTime } from '@/audio/timeline';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';

export function IconButton({
  icon,
  label,
  onPress,
  size = 28,
  active = false,
}: {
  icon: SymbolViewProps['name'];
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
      <SymbolView
        name={icon}
        size={size}
        tintColor={active ? tokens.colors.glow : tokens.colors['on-dusk']}
      />
    </Pressable>
  );
}

/** 진행 바(경과/남은 시간). 누른 위치로 이동한다(DESIGN 4절 플레이어). */
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
        <View className="h-1 overflow-hidden rounded-full bg-on-dusk/30">
          <View className="h-1 rounded-full bg-glow" style={{ width: `${progress * 100}%` }} />
        </View>
      </Pressable>
      <View className="flex-row justify-between">
        <Text className="text-[13px] text-on-dusk/80">{formatTime(status.currentTime)}</Text>
        <Text className="text-[13px] text-on-dusk/80">
          {ko.player.remaining(formatTime(status.duration - status.currentTime))}
        </Text>
      </View>
    </View>
  );
}

/** 컨트롤(DESIGN 4절): 좋아요 · 10초 되감기 · 재생/일시정지(흰 원) · 10초 앞으로 · 배경 사운드 */
export function PlayerControls({ storyId }: { storyId: string }) {
  const { status, togglePlay, seekBy } = usePlayer();
  const playing = status.playing;

  return (
    <View className="flex-row items-center justify-between">
      <FavoriteButton
        storyId={storyId}
        color={tokens.colors['on-dusk']}
        activeColor={tokens.colors.glow}
        size={24}
      />
      <IconButton
        icon={{ ios: 'gobackward.10', android: 'replay_10' }}
        label={ko.player.back10}
        onPress={() => seekBy(-10)}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? ko.player.pause : ko.player.play}
        onPress={togglePlay}
        className="h-[72px] w-[72px] items-center justify-center rounded-full bg-on-dusk"
      >
        <SymbolView
          name={
            playing
              ? { ios: 'pause.fill', android: 'pause' }
              : { ios: 'play.fill', android: 'play_arrow' }
          }
          size={32}
          tintColor={tokens.colors.dusk}
        />
      </Pressable>
      <IconButton
        icon={{ ios: 'goforward.10', android: 'forward_10' }}
        label={ko.player.forward10}
        onPress={() => seekBy(10)}
      />
      {/* 배경 사운드 선택은 다음 작업(2트랙 믹서)에서 이 자리에 붙인다. */}
      <View className="h-12 w-12" />
    </View>
  );
}

/** 반복 토글(DESIGN 4절: 전체 스토리 보기 칩 옆) */
export function RepeatToggle() {
  const { status, player } = usePlayer();
  return (
    <IconButton
      icon={{ ios: 'repeat', android: status.loop ? 'repeat_on' : 'repeat' }}
      label={ko.player.repeat}
      active={status.loop}
      size={22}
      onPress={() => {
        player.loop = !player.loop;
      }}
    />
  );
}
