import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * 생성 진행 화면의 오브(DESIGN 4절: 천천히 호흡하는 애니메이션, 반복 애니메이션은 오브 하나만).
 * "동작 줄이기"가 켜져 있으면 움직이지 않는다(DESIGN 5절).
 */
export function Orb({ breathing }: { breathing: boolean }) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (breathing && !reduceMotion) {
      scale.value = withRepeat(
        withTiming(1.08, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 300 });
    }
  }, [breathing, reduceMotion, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View accessible={false} className="h-48 w-48 items-center justify-center">
      <Animated.View style={style} className="h-44 w-44 items-center justify-center rounded-full bg-dawn-2">
        <View className="h-32 w-32 items-center justify-center rounded-full bg-surface">
          <View className="h-16 w-16 rounded-full bg-glow" />
        </View>
      </Animated.View>
    </View>
  );
}
