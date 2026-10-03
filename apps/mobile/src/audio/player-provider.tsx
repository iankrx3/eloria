import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { ko } from '@/i18n/ko';
import { usePlayerStore, type Track } from './player-store';

type PlayerContextValue = {
  player: AudioPlayer;
  status: AudioStatus;
  /** 다른 트랙이면 교체해서 처음부터, 같은 트랙이면 그대로 재생한다. */
  playTrack: (track: Track, url: string) => void;
  togglePlay: () => void;
  seekBy: (seconds: number) => void;
  /** 이 스토리가 플레이어에 올라가 있으면 멈추고 내린다(스토리 삭제 시). */
  unloadIfCurrent: (storyId: string) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

/**
 * 앱 전체에 플레이어 하나(ARCHITECTURE 4절). 화면을 닫아도 재생이 이어지고 미니 플레이어가 같은 인스턴스를 쓴다.
 * 스토리 플레이어가 잠금화면을 맡는다. Android는 이걸 켜지 않으면 백그라운드에서 약 3분 뒤 멈춘다.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const track = usePlayerStore((s) => s.track);
  const setTrack = usePlayerStore((s) => s.setTrack);

  useEffect(() => {
    // 잠금화면 컨트롤은 doNotMix여야 OS가 이 플레이어와 연결한다(expo-audio 문서).
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch((e: unknown) => {
      if (__DEV__) console.warn('[audio] setAudioModeAsync failed', e);
    });
  }, []);

  const playTrack = useCallback(
    (next: Track, url: string) => {
      if (track?.storyId !== next.storyId) {
        player.replace({ uri: url });
        setTrack(next);
        player.setActiveForLockScreen(
          true,
          { title: next.title, artist: ko.brand.name },
          { showSeekForward: true, showSeekBackward: true },
        );
      }
      player.play();
    },
    [player, track?.storyId, setTrack],
  );

  const togglePlay = useCallback(() => {
    if (player.playing) player.pause();
    else {
      // 끝까지 들은 뒤 다시 누르면 처음부터
      if (status.duration > 0 && status.currentTime >= status.duration - 0.5) void player.seekTo(0);
      player.play();
    }
  }, [player, status.currentTime, status.duration]);

  const seekBy = useCallback(
    (seconds: number) => {
      const target = Math.min(Math.max(player.currentTime + seconds, 0), status.duration || 0);
      void player.seekTo(target);
    },
    [player, status.duration],
  );

  const unloadIfCurrent = useCallback(
    (storyId: string) => {
      if (track?.storyId !== storyId) return;
      player.pause();
      player.clearLockScreenControls();
      player.replace(null);
      setTrack(null);
    },
    [player, track?.storyId, setTrack],
  );

  const value = useMemo(
    () => ({ player, status, playTrack, togglePlay, seekBy, unloadIfCurrent }),
    [player, status, playTrack, togglePlay, seekBy, unloadIfCurrent],
  );
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}
