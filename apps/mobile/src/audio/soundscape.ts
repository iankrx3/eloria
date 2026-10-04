/** 배경 사운드 볼륨 단계(ARCHITECTURE 4절: 0.0~0.5). 슬라이더 대신 3단계로 고른다(새 네이티브 의존성 없음). */
export const SOUNDSCAPE_VOLUME = { low: 0.15, mid: 0.3, high: 0.5 } as const;
export type SoundscapeVolume = keyof typeof SOUNDSCAPE_VOLUME;

/** 재생할 배경 사운드. url은 public 버킷(soundscapes)의 공개 URL이다. */
export type Soundscape = { id: string; url: string };
