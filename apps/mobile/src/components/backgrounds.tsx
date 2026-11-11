import type { ReactNode } from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View, type ViewStyle } from 'react-native';
import { glow, photoOverlay } from '@/theme/effects';

/** Figma "Glow" 타원 색 */
export const GLOW = {
  pink: 'rgba(246, 201, 218, 0.7)',
  lavender: 'rgba(217, 207, 240, 0.75)',
  sky: 'rgba(204, 214, 242, 0.8)',
  white: 'rgba(255, 255, 255, 0.8)',
} as const;

/** 흐릿한 빛 덩어리. 부모 기준 절대 위치(Figma 좌표 그대로) */
export function Glow({
  x,
  y,
  size,
  height,
  color,
}: {
  x: number;
  y: number;
  size: number;
  height?: number;
  color: string;
}) {
  // Figma의 블러 반경만큼 바깥으로 번지게 그린다(타원 크기의 약 1.6배).
  const w = size * 1.6;
  const h = (height ?? size) * 1.6;
  return (
    <View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: x - (w - size) / 2, top: y - (h - (height ?? size)) / 2 },
        { width: w, height: h, borderRadius: w / 2 },
        glow(color),
      ]}
    />
  );
}

/** 밝은 화면 바탕(그라디언트 + 빛). 스크롤 안에서 콘텐츠와 함께 움직이도록 children 뒤에 깐다. */
export function DawnBackdrop({
  style,
  glows,
}: {
  style: ViewStyle;
  glows?: { x: number; y: number; size: number; height?: number; color: string }[];
}) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {glows?.map((g, i) => (
        <Glow key={i} {...g} />
      ))}
    </View>
  );
}

/** 사진 전체 배경 + 보랏빛 오버레이(퀴즈·시네마틱·플레이어) */
export function PhotoBackground({
  source,
  overlay,
  children,
}: {
  source: ImageSourcePropType;
  overlay?: ViewStyle;
  children?: ReactNode;
}) {
  return (
    <View className="flex-1 bg-twilight">
      <Image
        source={source}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
        accessible={false}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, overlay ?? photoOverlay()]} />
      {children}
    </View>
  );
}
