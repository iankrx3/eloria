import { useId } from 'react';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

/**
 * Figma "Glow"(원·타원에 Layer blur)를 그대로 그린다. react-native-svg는 SVG 필터(feGaussianBlur)를
 * 지원하지 않으므로, 균일한 원을 가우시안 블러했을 때의 밝기 분포(Φ((r − d)/σ))를 방사형 그라디언트 정지점으로 옮긴다.
 */
export type GlowSpec = {
  /** Figma 노드 위치(원의 바깥 상자 왼쪽 위)와 크기 */
  x: number;
  y: number;
  width: number;
  height?: number;
  color: string;
  opacity: number;
  /** Figma blur 값의 절반 = stdDeviation */
  sigma: number;
};

// 표준정규분포 누적함수(근사, Abramowitz–Stegun 7.1.26)
function phi(z: number) {
  const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

const STEPS = 12;

export function SoftGlow({ x, y, width, height, color, opacity, sigma }: GlowSpec) {
  const id = useId().replace(/:/g, '');
  const h = height ?? width;
  const r = Math.min(width, h) / 2;
  const pad = sigma * 3;
  const rx = width / 2 + pad;
  const ry = h / 2 + pad;
  const R = r + pad;
  const stops = Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS;
    return { offset: t, opacity: opacity * phi((r - t * R) / sigma) };
  });

  return (
    <Svg
      pointerEvents="none"
      width={rx * 2}
      height={ry * 2}
      style={{ position: 'absolute', left: x - pad, top: y - pad }}
    >
      <Defs>
        <RadialGradient id={id} cx={rx} cy={ry} rx={rx} ry={ry} gradientUnits="userSpaceOnUse">
          {stops.map((s) => (
            <Stop key={s.offset} offset={s.offset} stopColor={color} stopOpacity={s.opacity} />
          ))}
        </RadialGradient>
      </Defs>
      <Ellipse cx={rx} cy={ry} rx={rx} ry={ry} fill={`url(#${id})`} />
    </Svg>
  );
}

/** Figma 화면에서 쓰는 빛 색·세기(SVG에서 읽은 값) */
export const GLOW = {
  pink: { color: '#F6C9DA', opacity: 0.55, sigma: 35 },
  pinkWide: { color: '#F6C9DA', opacity: 0.5, sigma: 40 },
  periwinkle: { color: '#C9D3F4', opacity: 0.6, sigma: 35 },
  periwinkleWide: { color: '#C9D3F4', opacity: 0.5, sigma: 40 },
  cream: { color: '#FFF4E4', opacity: 0.75, sigma: 30 },
  lilac: { color: '#E3CFF0', opacity: 0.55, sigma: 40 },
} as const;
