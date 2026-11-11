import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { create } from 'zustand';

/**
 * 햅틱(Figma 화면 노트의 "햅틱: …" 표기, DESIGN 5절). 설정 > 햅틱 진동이 꺼져 있으면 아무것도 하지 않는다.
 * 실패해도(지원하지 않는 기기) 조용히 넘어간다.
 */
export type HapticKind =
  'light' | 'medium' | 'heavy' | 'soft' | 'selection' | 'success' | 'warning' | 'error';

const STORAGE_KEY = 'settings.haptics';

type HapticSettings = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};

export const useHapticSettings = create<HapticSettings>((set) => ({
  enabled: true,
  setEnabled: (enabled) => {
    set({ enabled });
    void AsyncStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  },
}));

/** 앱 시작 시 한 번 저장된 설정을 읽는다. */
export async function loadHapticSettings() {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  if (saved !== null) useHapticSettings.setState({ enabled: saved === '1' });
}

function run(kind: HapticKind): Promise<void> {
  switch (kind) {
    case 'light':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    case 'medium':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    case 'heavy':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    case 'soft':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    case 'selection':
      return Haptics.selectionAsync();
    case 'success':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    case 'warning':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    case 'error':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

export function haptic(kind: HapticKind | undefined) {
  if (!kind || !useHapticSettings.getState().enabled) return;
  run(kind).catch(() => undefined);
}
