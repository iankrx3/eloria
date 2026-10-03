import { create } from 'zustand';

/** 지금 플레이어에 올라간 트랙. 재생 상태만 Zustand에 둔다(ARCHITECTURE 3절). */
export type Track = { storyId: string; title: string };

type PlayerState = {
  track: Track | null;
  setTrack: (track: Track | null) => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  track: null,
  setTrack: (track) => set({ track }),
}));
