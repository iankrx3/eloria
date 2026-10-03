/**
 * 2초마다 부드러운 차임(도·미)이 울리는 WAV(16kHz, 모노, 16비트 PCM).
 * mock TTS가 귀로 확인할 수 있는 소리를 내려고 쓴다(재생·백그라운드·이어폰 분리 확인용).
 * MP3는 인코더 없이 만들 수 없어 WAV를 쓴다. 실제 음성(ElevenLabs)은 MP3다(AI_PIPELINE 7절).
 */
const SAMPLE_RATE = 16_000;
const CHIME_EVERY_SEC = 2;
const CHIME_SEC = 0.6;
const NOTES = [523.25, 659.25]; // C5, E5
const AMPLITUDE = 0.18;

export function chimeWav(seconds: number): { bytes: Uint8Array; durationSec: number } {
  const totalSamples = Math.max(1, Math.round(seconds * SAMPLE_RATE));
  const dataBytes = totalSamples * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  ascii(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt 청크 크기
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // 모노
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true); // 바이트/초
  view.setUint16(32, 2, true); // 블록 정렬
  view.setUint16(34, 16, true); // 비트/샘플
  ascii(36, 'data');
  view.setUint32(40, dataBytes, true);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const beat = Math.floor(t / CHIME_EVERY_SEC);
    const local = t - beat * CHIME_EVERY_SEC;
    let sample = 0;
    if (local < CHIME_SEC) {
      const freq = NOTES[beat % NOTES.length]!;
      const envelope = Math.min(local / 0.02, 1) * Math.exp(-local * 5); // 짧은 어택 + 감쇠
      sample = Math.sin(2 * Math.PI * freq * t) * envelope * AMPLITUDE;
    }
    view.setInt16(44 + i * 2, Math.round(sample * 0x7fff), true);
  }

  return { bytes: new Uint8Array(buffer), durationSec: totalSamples / SAMPLE_RATE };
}
