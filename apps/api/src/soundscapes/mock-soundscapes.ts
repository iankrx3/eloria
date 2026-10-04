/**
 * 실제 배경 사운드(ElevenLabs Sound Effects, AI_PIPELINE 7절)를 만들기 전에 쓰는 합성 루프.
 * 노이즈를 걸러 비·파도·벽난로·백색소음 느낌을 낸다. 2트랙 재생·잠금화면·볼륨을 귀로 확인하기 위한 용도다.
 * 이어 붙여 반복해도 끊김이 없도록 끝부분을 처음과 겹쳐(crossfade) 만든다.
 */
export const MOCK_SOUNDSCAPES = [
  { key: 'rain', displayName: '빗소리' },
  { key: 'ocean', displayName: '파도' },
  { key: 'fireplace', displayName: '벽난로' },
  { key: 'white_noise', displayName: '백색소음' },
] as const;
export type MockSoundscapeKey = (typeof MOCK_SOUNDSCAPES)[number]['key'];

const SAMPLE_RATE = 22_050;
export const LOOP_SECONDS = 20;
const CROSSFADE_SECONDS = 1;

/** 결정적 난수(테스트에서 같은 결과) */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 핑크 노이즈(Paul Kellet 근사). 백색소음보다 부드럽다. */
function pinkNoise(rand: () => number) {
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;
  return () => {
    const white = rand() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const out = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    return out * 0.11;
  };
}

/** 브라운 노이즈(누적 후 새어 나가게). 낮고 묵직한 소리. */
function brownNoise(rand: () => number) {
  let last = 0;
  return () => {
    last = (last + 0.02 * (rand() * 2 - 1)) * 0.998;
    return last * 3.5;
  };
}

function synthesize(key: MockSoundscapeKey, total: number): Float32Array {
  const rand = mulberry32(key.length * 7919 + key.charCodeAt(0));
  const out = new Float32Array(total);
  const pink = pinkNoise(rand);
  const brown = brownNoise(rand);
  let burst = 0; // 빗방울·장작 튀는 소리의 남은 에너지
  let burstTone = 0;

  for (let i = 0; i < total; i++) {
    const t = i / SAMPLE_RATE;
    switch (key) {
      case 'rain': {
        if (rand() < 40 / SAMPLE_RATE) burst = 0.25 + rand() * 0.35;
        burst *= 0.995;
        out[i] = pink() * 0.8 + (rand() * 2 - 1) * burst * 0.5;
        break;
      }
      case 'ocean': {
        // 10초 주기 파도. 루프(20초)가 주기의 정수배라 이어 붙여도 맞물린다.
        const swell = 0.25 + 0.75 * Math.sin((Math.PI * t) / 10) ** 2;
        out[i] = (brown() * 0.6 + pink() * 0.4) * swell;
        break;
      }
      case 'fireplace': {
        if (rand() < 6 / SAMPLE_RATE) {
          burst = 0.4 + rand() * 0.6;
          burstTone = 800 + rand() * 2400;
        }
        burst *= 0.993;
        const crackle = Math.sin(2 * Math.PI * burstTone * t) * (rand() * 2 - 1) * burst;
        out[i] = brown() * 0.5 + crackle * 0.6;
        break;
      }
      case 'white_noise':
        out[i] = (rand() * 2 - 1) * 0.35;
        break;
    }
  }
  return out;
}

/** 끝 crossfade 구간을 처음과 겹쳐 루프 길이만큼 돌려준다. */
function makeSeamless(samples: Float32Array, loop: number, fade: number): Float32Array {
  const out = samples.slice(0, loop);
  for (let i = 0; i < fade; i++) {
    const w = i / fade;
    out[i] = samples[loop + i]! * (1 - w) + samples[i]! * w;
  }
  return out;
}

function normalize(samples: Float32Array, peak = 0.6) {
  let max = 0;
  for (const s of samples) max = Math.max(max, Math.abs(s));
  if (max === 0) return samples;
  const gain = peak / max;
  return samples.map((s) => s * gain);
}

function encodeWav(samples: Float32Array): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset: number, s: string) =>
    [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // 모노
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => {
    const v = Math.max(-1, Math.min(1, s));
    view.setInt16(44 + i * 2, Math.round(v * 32767), true);
  });
  return new Uint8Array(buffer);
}

/** 반복 재생용 WAV(22.05kHz 모노 16bit, 20초) */
export function mockSoundscapeWav(key: MockSoundscapeKey): {
  bytes: Uint8Array;
  loopDurationSec: number;
} {
  const loop = LOOP_SECONDS * SAMPLE_RATE;
  const fade = CROSSFADE_SECONDS * SAMPLE_RATE;
  const raw = synthesize(key, loop + fade);
  const samples = normalize(makeSeamless(raw, loop, fade));
  return { bytes: encodeWav(samples), loopDurationSec: LOOP_SECONDS };
}
