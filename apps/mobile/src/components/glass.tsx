import { BlurView } from 'expo-blur';
import { createContext, useContext, type ReactNode, type RefObject } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * 사진 위 유리 효과(Figma backdrop-blur). Android는 흐릴 대상(BlurTargetView)을 알려 줘야 해서
 * PhotoBackground가 사진을 감싼 ref를 이 컨텍스트로 내려 준다. 대상이 없으면(밝은 화면) 반투명 색만 칠한다.
 */
export const BlurTargetContext = createContext<RefObject<View | null> | null>(null);

type Props = {
  /** Figma backdrop-blur 픽셀 값 */
  blur?: number;
  /** 유리 색(Figma 배경, 예: rgba(255,255,255,0.5)). 흐림 위에 칠한다. 배경색은 className에 넣지 않는다. */
  fill: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  pointerEvents?: 'box-none' | 'none' | 'auto';
};

export function GlassView({ blur = 10, fill, className, style, children, pointerEvents }: Props) {
  const target = useContext(BlurTargetContext);
  return (
    <View
      className={`overflow-hidden ${className ?? ''}`}
      style={style}
      pointerEvents={pointerEvents}
    >
      {target && (
        <BlurView
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          intensity={Math.min(100, blur * 4)}
          tint="light"
          blurTarget={target}
          blurMethod="dimezisBlurViewSdk31Plus"
        />
      )}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
      {children}
    </View>
  );
}

/**
 * 이미 모양(둥근 모서리·테두리·overflow-hidden)이 있는 Pressable 안에 깔아 쓰는 유리 바탕.
 * 첫 자식으로 넣는다.
 */
export function GlassFill({ blur = 10, fill }: { blur?: number; fill: string }) {
  const target = useContext(BlurTargetContext);
  return (
    <>
      {target && (
        <BlurView
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          intensity={Math.min(100, blur * 4)}
          tint="light"
          blurTarget={target}
          blurMethod="dimezisBlurViewSdk31Plus"
        />
      )}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
    </>
  );
}
