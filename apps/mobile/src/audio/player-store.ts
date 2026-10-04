import { create } from 'zustand';
import type { Soundscape, SoundscapeVolume } from './soundscape';

/** 지금 플레이어에 올라간 트랙. 재생 상태만 Zustand에 둔다(ARCHITECTURE 3절). */
export type Track = { storyId: string; title: string };

type PlayerState = {
  track: Track | null;
  setTrack: (track: Track | null) => void;
  /** 배경 사운드. undefined = 아직 프로필 기본값을 읽지 않음, null = 없음 */
  soundscape: Soundscape | null | undefined;
  setSoundscape: (soundscape: Soundscape | null) => void;
  soundscapeVolume: SoundscapeVolume;
  setSoundscapeVolume: (volume: SoundscapeVolume) => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  track: null,
  setTrack: (track) => set({ track }),
  soundscape: undefined,
  setSoundscape: (soundscape) => set({ soundscape }),
  soundscapeVolume: 'mid',
  setSoundscapeVolume: (soundscapeVolume) => set({ soundscapeVolume }),
}));
