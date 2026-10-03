import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View } from 'react-native';
import { usePlayer } from '@/audio/player-provider';
import { usePlayerStore } from '@/audio/player-store';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';

/** 탭 바 위에 고정되는 미니 플레이어(ARCHITECTURE 3절). 누르면 풀 플레이어를 연다. */
export function MiniPlayer() {
  const track = usePlayerStore((s) => s.track);
  const { status, togglePlay } = usePlayer();
  if (!track) return null;

  const progress = status.duration > 0 ? Math.min(status.currentTime / status.duration, 1) : 0;

  return (
    <View className="mx-2 mb-1 overflow-hidden rounded-card bg-plum-deep">
      <View className="h-0.5 bg-on-dusk/20">
        <View className="h-0.5 bg-glow" style={{ width: `${progress * 100}%` }} />
      </View>
      <View className="flex-row items-center gap-3 px-4 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ko.player.openPlayer(track.title)}
          onPress={() =>
            router.push({ pathname: '/player/[storyId]', params: { storyId: track.storyId } })
          }
          className="flex-1 py-1"
        >
          <Text numberOfLines={1} className="text-[13px] text-on-dusk">
            {track.title}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={status.playing ? ko.player.pause : ko.player.play}
          onPress={togglePlay}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center"
        >
          <SymbolView
            name={
              status.playing
                ? { ios: 'pause.fill', android: 'pause' }
                : { ios: 'play.fill', android: 'play_arrow' }
            }
            size={22}
            tintColor={tokens.colors['on-dusk']}
          />
        </Pressable>
      </View>
    </View>
  );
}
