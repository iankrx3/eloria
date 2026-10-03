import { View } from 'react-native';

/**
 * 채워진 하트. Android의 expo-symbols는 Material Symbols Outlined 글꼴이라 채워진 하트(FILL)가 없어
 * 사각형 하나와 원 두 개로 그린다(45도 회전한 정사각형의 위·오른쪽 변에 원을 붙인 모양).
 */
export function FilledHeart({ size, color }: { size: number; color: string }) {
  const a = size * 0.56; // 정사각형 한 변 = 원 지름
  return (
    <View
      accessible={false}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={{
          width: a,
          height: a,
          backgroundColor: color,
          transform: [{ translateY: a * 0.18 }, { rotate: '-45deg' }],
        }}
      >
        <View
          style={{
            position: 'absolute',
            width: a,
            height: a,
            borderRadius: a / 2,
            backgroundColor: color,
            top: -a / 2,
            left: 0,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: a,
            height: a,
            borderRadius: a / 2,
            backgroundColor: color,
            top: 0,
            left: a / 2,
          }}
        />
      </View>
    </View>
  );
}
