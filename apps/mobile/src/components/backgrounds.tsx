import { BlurTargetView } from 'expo-blur';
import { useRef, type ReactNode } from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurTargetContext } from '@/components/glass';
import { type GlowSpec, SoftGlow } from '@/components/soft-glow';
import { photoOverlay } from '@/theme/effects';

export { GLOW } from '@/components/soft-glow';

/** 밝은 화면 바탕(그라디언트 + Figma Glow). 스크롤 안에서 콘텐츠와 함께 움직이도록 children 뒤에 깐다. */
export function DawnBackdrop({ style, glows }: { style: ViewStyle; glows?: GlowSpec[] }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style, { overflow: 'hidden' }]}>
      {glows?.map((g, i) => (
        <SoftGlow key={i} {...g} />
      ))}
    </View>
  );
}

/** 개발 빌드에서 사진을 못 그리면 Metro 로그에 원인을 남긴다. */
export function logImageError(e: { nativeEvent: { error?: unknown } }) {
  if (__DEV__) console.warn('[image] load failed', e.nativeEvent.error);
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
  // 사진(과 오버레이)을 흐림 대상으로 감싸, 위의 유리 요소(GlassView)가 사진을 흐리게 비추게 한다.
  const target = useRef<View>(null);
  return (
    <View className="flex-1 overflow-hidden bg-twilight">
      <BlurTargetView ref={target} collapsable={false} style={StyleSheet.absoluteFill}>
        <Image
          source={source}
          resizeMode="cover"
          // absoluteFill만 주면 Android의 BlurTargetView 자식이 원본 픽셀 크기로 커진다.
          style={{ width: '100%', height: '100%' }}
          accessible={false}
          onError={logImageError}
        />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, overlay ?? photoOverlay()]} />
      </BlurTargetView>
      <BlurTargetContext.Provider value={target}>{children}</BlurTargetContext.Provider>
    </View>
  );
}
