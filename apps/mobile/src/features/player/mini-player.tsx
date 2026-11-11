import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { usePlayer } from '@/audio/player-provider';
import { usePlayerStore } from '@/audio/player-store';
import { formatTime } from '@/audio/timeline';
import { Icon } from '@/components/icons/icon';
import { ko } from '@/i18n/ko';
import { storyCover } from '@/theme/images';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';
import { haptic } from '@/lib/haptics';

/** 탭 바 위에 떠 있는 미니 플레이어(Figma Home / Mini Player). 재생 중인 트랙이 있을 때만 보인다. */
export function MiniPlayer() {
  const track = usePlayerStore((s) => s.track);
  const { status, togglePlay } = usePlayer();
  if (!track) return null;

  return (
    <View className="flex-row items-center gap-3 rounded-[20px] bg-twilight/85 py-2 pl-2 pr-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ko.player.openPlayer(track.title)}
        onPress={() =>
          router.push({ pathname: '/player/[storyId]', params: { storyId: track.storyId } })
        }
        className="flex-1 flex-row items-center gap-3"
      >
        <Image source={storyCover(track.storyId)} className="h-11 w-11 rounded-xl" />
        <View className="flex-1 gap-[2px]">
          <Text className="font-display-semibold text-[10px] tracking-[2.5px] text-on-photo/60">
            {ko.player.nowPlaying}
          </Text>
          <Text numberOfLines={1} className={`${type.caption} text-on-photo`}>
            {track.title}
          </Text>
        </View>
        {status.duration > 0 && (
          <Text className={`${type.caption} text-on-photo/60`}>
            {`${formatTime(status.currentTime)} / ${formatTime(status.duration)}`}
          </Text>
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={status.playing ? ko.player.pause : ko.player.play}
        onPress={() => {
          haptic('light');
          togglePlay();
        }}
        hitSlop={10}
      >
        <Icon
          name={status.playing ? 'pause' : 'play'}
          size={22}
          color={tokens.colors['on-photo']}
        />
      </Pressable>
    </View>
  );
}
