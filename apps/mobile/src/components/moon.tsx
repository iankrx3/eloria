import { useEffect } from 'react';
import { Image, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { moonSymbol } from '@/theme/images';

// 이미지 안에서 초승달 바깥 원의 중심과 지름 비율(assets/images/brand/moon-symbol.png, 600px 기준)
const CX = 290 / 600;
const CY = 310 / 600;
const DIAMETER = 400 / 600;

/** ARIN 상징: 은은하게 빛나는 초승달(Figma Symbol / Crescent Moon). 유리 구슬로 그리지 않는다. */
export function MoonSymbol({ size, pulse = false }: { size: number; pulse?: boolean }) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (pulse && !reduceMotion) {
      opacity.value = 0.7;
      opacity.value = withRepeat(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(opacity);
      opacity.value = 1;
    }
  }, [pulse, reduceMotion, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  // size = 초승달 바깥 원 지름
  const box = size / DIAMETER;

  return (
    <View accessible={false} style={{ width: size, height: size }}>
      <Animated.View
        style={[
          { position: 'absolute', left: size / 2 - CX * box, top: size / 2 - CY * box },
          style,
        ]}
      >
        <Image source={moonSymbol} style={{ width: box, height: box }} />
      </Animated.View>
    </View>
  );
}

const SPARKLE =
  'M4.2 0C4.48 2.45 5.95 3.92 8.4 4.2C5.95 4.48 4.48 5.95 4.2 8.4C3.92 5.95 2.45 4.48 0 4.2C2.45 3.92 3.92 2.45 4.2 0Z';

export function Sparkle({ size, color = '#FFFFFF' }: { size: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 8.4 8.4">
      <Path d={SPARKLE} fill={color} />
    </Svg>
  );
}

const HERO_SPARKLES = [
  { x: 226, y: 14, s: 16 },
  { x: 54.5, y: 58.5, s: 11 },
  { x: 249.5, y: 109.5, s: 9 },
  { x: 82.5, y: 138.5, s: 7 },
  { x: 192.5, y: -3.5, s: 7 },
];

/** 홈 상단 "오늘의 달"(Figma H01 Moon hero, 312×168): 후광 + 유리 원판 + 초승달 + 반짝임 */
export function MoonHero() {
  return (
    <View accessible={false} style={{ width: 312, height: 168 }}>
      {/* 후광 */}
      <View
        style={{
          position: 'absolute',
          left: 46,
          top: -26,
          width: 220,
          height: 220,
          borderRadius: 110,
          experimental_backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0) 70%)',
        }}
      />
      {/* 궤도 */}
      <View
        style={{
          position: 'absolute',
          left: 58,
          top: -14,
          width: 196,
          height: 196,
          borderRadius: 98,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.55)',
        }}
      />
      {/* 유리 원판 */}
      <View
        style={{
          position: 'absolute',
          left: 90,
          top: 18,
          width: 132,
          height: 132,
          borderRadius: 66,
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.9)',
          experimental_backgroundImage:
            'radial-gradient(circle at 35% 30%, #FFFFFF 0%, #F4ECF8 50%, #E3D7F0 100%)',
          boxShadow: '0px 14px 34px 0px rgba(113,77,127,0.28)',
        }}
      />
      <View style={{ position: 'absolute', left: 122, top: 54 }}>
        <MoonSymbol size={61} />
      </View>
      {HERO_SPARKLES.map((p, i) => (
        <View key={i} style={{ position: 'absolute', left: p.x, top: p.y, opacity: 0.9 }}>
          <Sparkle size={p.s} />
        </View>
      ))}
    </View>
  );
}
