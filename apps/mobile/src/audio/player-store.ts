import { create } from 'zustand';
import type { Soundscape, SoundscapeVolume } from './soundscape';

/** 지금 플레이어에 올라간 트랙. 재생 상태만 Zustand에 둔다(ARCHITECTURE 3절). loop = 반복 재생으로 시작(주파수). */
export type Track = { storyId: string; title: string; loop?: boolean };

type PlayerState = {
  track: Track | null;
  setTrack: (track: Track | null) => void;
  /** 이어 들을 트랙(소원 묶음 전체 이어 듣기, L06). 지금 트랙이 끝나면 앞에서부터 재생한다. */
  queue: Track[];
  setQueue: (queue: Track[]) => void;
  /** 배경 사운드. undefined = 아직 프로필 기본값을 읽지 않음, null = 없음 */
  soundscape: Soundscape | null | undefined;
  setSoundscape: (soundscape: Soundscape | null) => void;
  soundscapeVolume: SoundscapeVolume;
  setSoundscapeVolume: (volume: SoundscapeVolume) => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  track: null,
  setTrack: (track) => set({ track }),
  queue: [],
  setQueue: (queue) => set({ queue }),
  soundscape: undefined,
  setSoundscape: (soundscape) => set({ soundscape }),
  soundscapeVolume: 'mid',
  setSoundscapeVolume: (soundscapeVolume) => set({ soundscapeVolume }),
}));
