import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  title: string;
  body?: string;
  /** 제목 위 작은 줄(예: 퀴즈 진행 "3 / 12") */
  eyebrow?: string;
  footer?: ReactNode;
  children?: ReactNode;
};

/** 아직 구현 전인 화면의 공통 틀. 실제 화면을 만들면 이 컴포넌트를 쓰지 않는다. */
export function PlaceholderScreen({ title, body, eyebrow, footer, children }: Props) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dawn">
      <View className="flex-1 justify-between px-gutter py-6">
        <View className="gap-3 pt-6">
          {eyebrow && <Text className="text-[13px] text-ink-muted">{eyebrow}</Text>}
          <Text className="text-[28px] leading-[38px] text-plum-deep">{title}</Text>
          {body && <Text className="text-[16px] leading-[24px] text-ink-muted">{body}</Text>}
          {children}
        </View>
        {footer && <View className="gap-3">{footer}</View>}
      </View>
    </SafeAreaView>
  );
}
