import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/icons/icon';
import { ko } from '@/i18n/ko';
import { haptic } from '@/lib/haptics';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

/** 밝은 화면 머리: ‹ + H1 제목(Figma H11·H12·H13·P02·P04 Header) */
export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View className="flex-row items-center gap-[10px]">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ko.common.back}
        hitSlop={12}
        onPress={() => {
          haptic('light');
          router.back();
        }}
      >
        <Icon name="back" size={24} color={tokens.colors['plum-deep']} />
      </Pressable>
      <Text accessibilityRole="header" className={`${type.h1} flex-1 text-plum-deep`}>
        {title}
      </Text>
      {right}
    </View>
  );
}
