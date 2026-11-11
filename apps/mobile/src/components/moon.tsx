import { useEffect, type ReactNode } from 'react';
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
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { SoftGlow } from '@/components/soft-glow';
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

// Figma H01 Moon hero(312×168) 안의 반짝임: 노드 위치·크기
const HERO_SPARKLES = [
  { x: 226, y: 14, s: 16 },
  { x: 54.5, y: 58.5, s: 11 },
  { x: 249.5, y: 109.5, s: 9 },
  { x: 82.5, y: 138.5, s: 7 },
  { x: 192.5, y: -3.5, s: 7 },
];

// Figma "Crescent"(100.676×101.258 SVG 상자) — 금빛 초승달
const CRESCENT =
  'M44.2344 20C40.3413 24.6792 38 30.6951 38 37.2578C38 52.1695 50.0883 64.2578 65 64.2578C70.8454 64.2578 76.2562 62.3992 80.6758 59.2422C76.8241 71.9816 64.9963 81.2578 51 81.2578C33.8792 81.2578 20 67.3786 20 50.2578C20 35.4609 30.3674 23.087 44.2344 20Z';

/**
 * 홈 상단 "오늘의 달"(Figma H01 Moon hero). Figma SVG의 색·위치를 그대로 옮기고,
 * react-native-svg가 못 그리는 블러는 SoftGlow(가우시안 분포 그라디언트)로 대신한다.
 * children = 오른쪽 아래 비전 사진 배지 자리.
 */
export function MoonHero({ children }: { children?: ReactNode }) {
  return (
    <View accessible={false} style={{ width: 312, height: 168 }}>
      {/* 궤도: 흐린 점선 원 */}
      <Svg width={196} height={196} style={{ position: 'absolute', left: 58, top: -14 }}>
        <Circle
          cx={98}
          cy={98}
          r={97}
          stroke="#FFFFFF"
          strokeOpacity={0.7}
          strokeWidth={1}
          strokeDasharray="1.5 5"
          fill="none"
        />
      </Svg>
      {/* 후광 */}
      <Svg width={220} height={220} style={{ position: 'absolute', left: 46, top: -26 }}>
        <Defs>
          <RadialGradient id="moonHalo" cx={110} cy={110} r={110} gradientUnits="userSpaceOnUse">
            <Stop offset={0} stopColor="#FFFFFF" stopOpacity={0.95} />
            <Stop offset={0.4} stopColor="#FBEFF6" stopOpacity={0.6} />
            <Stop offset={1} stopColor="#E6D9F0" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={110} cy={110} r={110} fill="url(#moonHalo)" />
      </Svg>
      {/* 유리 원판: 아래로 깔리는 보랏빛 그림자 + 대각선 그라디언트 + 흰 테두리 */}
      <View
        style={{
          position: 'absolute',
          left: 90.6,
          top: 18.6,
          width: 130.8,
          height: 130.8,
          borderRadius: 65.4,
          boxShadow: '0px 16px 34px 0px rgba(113,77,127,0.22)',
        }}
      />
      <Svg width={200} height={200} style={{ position: 'absolute', left: 56, top: 0 }}>
        <Defs>
          <LinearGradient
            id="moonDisc"
            x1={52.857}
            y1={36.857}
            x2={147.143}
            y2={131.143}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset={0} stopColor="#FFFFFF" stopOpacity={0.9} />
            <Stop offset={0.5} stopColor="#F2E6F5" stopOpacity={0.7} />
            <Stop offset={1} stopColor="#D6DDF5" stopOpacity={0.75} />
          </LinearGradient>
          <RadialGradient
            id="moonDiscShade"
            cx={128}
            cy={118}
            r={70}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset={0.55} stopColor="#C9B3DE" stopOpacity={0} />
            <Stop offset={1} stopColor="#C9B3DE" stopOpacity={0.35} />
          </RadialGradient>
        </Defs>
        <Circle
          cx={100}
          cy={84}
          r={65.4}
          fill="url(#moonDisc)"
          stroke="#FFFFFF"
          strokeWidth={1.2}
        />
        <Circle cx={100} cy={84} r={65.4} fill="url(#moonDiscShade)" />
      </Svg>
      {/* 초승달 금빛 번짐 */}
      <SoftGlow x={126} y={58} width={52} color="#F2C185" opacity={0.85} sigma={10} />
      <Svg
        width={100.676}
        height={101.258}
        viewBox="0 0 100.676 101.258"
        style={{ position: 'absolute', left: 102, top: 33.74 }}
      >
        <Defs>
          <LinearGradient
            id="moonCrescent"
            x1={28.668}
            y1={28.751}
            x2={72.422}
            y2={72.089}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset={0} stopColor="#FFFBF4" />
            <Stop offset={0.55} stopColor="#F6DDB8" />
            <Stop offset={1} stopColor="#E2B57E" />
          </LinearGradient>
        </Defs>
        <Path d={CRESCENT} fill="url(#moonCrescent)" />
      </Svg>
      {/* 유리 반사광(46×16 타원, -28°) */}
      <View
        style={{
          position: 'absolute',
          left: 109,
          top: 20.3,
          width: 46,
          height: 16,
          transform: [{ rotate: '-28deg' }],
        }}
      >
        <SoftGlow x={0} y={0} width={46} height={16} color="#FFFFFF" opacity={0.75} sigma={3} />
      </View>
      {HERO_SPARKLES.map((p, i) => (
        <View key={i} style={{ position: 'absolute', left: p.x, top: p.y }}>
          <SoftGlow x={0} y={0} width={p.s} color="#FFFFFF" opacity={0.6} sigma={4} />
          <Sparkle size={p.s} />
        </View>
      ))}
      {children}
    </View>
  );
}
