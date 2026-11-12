import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

/** 최근 들은 것(마이 "최근 들은 것"). 기기에만 두고 최근 30개까지. 서버 재생 기록(play_events)은 계측 때. */
const KEY = 'player.recent';
const MAX = 30;

export type RecentPlay = { storyId: string; playedAt: string };

type State = { items: RecentPlay[]; add: (storyId: string) => void };

export const useRecentPlays = create<State>((set, get) => ({
  items: [],
  add: (storyId) => {
    const items = [
      { storyId, playedAt: new Date().toISOString() },
      ...get().items.filter((p) => p.storyId !== storyId),
    ].slice(0, MAX);
    set({ items });
    void AsyncStorage.setItem(KEY, JSON.stringify(items));
  },
}));

export async function loadRecentPlays() {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      useRecentPlays.setState({
        items: parsed
          .filter(
            (p): p is RecentPlay =>
              typeof p === 'object' &&
              p !== null &&
              typeof (p as RecentPlay).storyId === 'string' &&
              typeof (p as RecentPlay).playedAt === 'string',
          )
          .slice(0, MAX),
      });
    }
  } catch {
    // 깨진 값은 무시하고 새로 쌓는다.
  }
}
