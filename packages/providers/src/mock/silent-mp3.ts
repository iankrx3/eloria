/**
 * 무음 MP3(MPEG-1 Layer III, 128kbps, 44.1kHz). 프레임 헤더 뒤를 0으로 채우면 사이드 정보가 0이라
 * 디코더가 무음으로 재생한다. mock TTS가 실제 재생 가능한 파일을 돌려주려고 쓴다.
 */
const FRAME_BYTES = 417; // floor(144 * 128000 / 44100), 패딩 없음
const SAMPLES_PER_FRAME = 1152;
const SAMPLE_RATE = 44_100;
const HEADER = [0xff, 0xfb, 0x90, 0x00];

export function silentMp3(seconds: number): { bytes: Uint8Array; durationSec: number } {
  const frames = Math.max(1, Math.ceil((seconds * SAMPLE_RATE) / SAMPLES_PER_FRAME));
  const bytes = new Uint8Array(frames * FRAME_BYTES);
  for (let i = 0; i < frames; i++) bytes.set(HEADER, i * FRAME_BYTES);
  return { bytes, durationSec: (frames * SAMPLES_PER_FRAME) / SAMPLE_RATE };
}
