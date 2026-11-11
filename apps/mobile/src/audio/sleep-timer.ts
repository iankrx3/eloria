import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

/** 수면 타이머(설정 > 재생, Figma P02). 0 = 끔. 재생이 시작되면 이 시간 뒤에 멈춘다. */
export const SLEEP_OPTIONS = [0, 15, 30, 60] as const;
export type SleepMinutes = (typeof SLEEP_OPTIONS)[number];

const KEY = 'settings.sleepTimer';

type SleepTimerState = { minutes: SleepMinutes; setMinutes: (m: SleepMinutes) => void };

export const useSleepTimer = create<SleepTimerState>((set) => ({
  minutes: 0,
  setMinutes: (minutes) => {
    set({ minutes });
    void AsyncStorage.setItem(KEY, String(minutes));
  },
}));

export async function loadSleepTimer() {
  const saved = Number(await AsyncStorage.getItem(KEY));
  if ((SLEEP_OPTIONS as readonly number[]).includes(saved)) {
    useSleepTimer.setState({ minutes: saved as SleepMinutes });
  }
}
