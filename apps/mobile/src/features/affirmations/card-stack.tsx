import { useLayoutEffect, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { BackCards } from './affirmation-card';

/** 이만큼 밀거나 빠르게 튕기면 넘긴다. */
const SWIPE_RATIO = 0.28;
const FLING_VELOCITY = 800;
/** Figma A02: 카드는 최대 8° 기울어진다. */
const MAX_TILT = 8;

/**
 * 확언 카드 더미와 스와이프(Figma A02). 왼쪽으로 밀면 다음, 오른쪽으로 밀면 이전, 덜 밀면 제자리.
 * 카드가 화면 밖으로 나간 뒤 번호를 바꾸고, 새 카드가 그려지면 가운데로 되돌린다(깜빡임 방지).
 */
export function CardStack({
  index,
  total,
  canPrevious,
  onNext,
  onPrevious,
  onDragging,
  children,
}: {
  index: number;
  total: number;
  canPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
  /** 끄는 동안 true. 화면이 컨트롤 대신 "넘기면 다음 확언"을 보여 준다. */
  onDragging: (dragging: boolean) => void;
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);

  // 번호가 바뀌어 새 카드가 그려진 뒤 가운데로 되돌린다.
  useLayoutEffect(() => {
    x.value = 0;
  }, [index, x]);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-16, 16])
    .onBegin(() => {
      scheduleOnRN(onDragging, true);
    })
    .onUpdate((e) => {
      // 처음 카드에서 오른쪽(이전)으로는 조금만 끌린다.
      x.value = !canPrevious && e.translationX > 0 ? e.translationX * 0.25 : e.translationX;
    })
    .onEnd((e) => {
      const goNext = x.value < -width * SWIPE_RATIO || e.velocityX < -FLING_VELOCITY;
      const goPrevious =
        canPrevious && (x.value > width * SWIPE_RATIO || e.velocityX > FLING_VELOCITY);
      if (goNext) {
        x.value = withTiming(-width * 1.3, { duration: 220 }, (finished) => {
          if (finished) scheduleOnRN(onNext);
        });
      } else if (goPrevious) {
        x.value = withTiming(width * 1.3, { duration: 220 }, (finished) => {
          if (finished) scheduleOnRN(onPrevious);
        });
      } else {
        x.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    })
    .onFinalize(() => {
      scheduleOnRN(onDragging, false);
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { rotate: `${interpolate(x.value, [-width, 0, width], [-MAX_TILT, 0, MAX_TILT])}deg` },
    ],
  }));

  return (
    <BackCards count={Math.min(2, total - index - 1)}>
      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>{children}</Animated.View>
      </GestureDetector>
    </BackCards>
  );
}
