import { ActivityIndicator, Pressable, Text } from 'react-native';
import tokens from '@/theme/tokens.json';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'solid' | 'ghost';
};

/** 원형 plum 버튼(DESIGN 2절: 버튼은 원형, 그라디언트 없음). */
export function PrimaryButton({ label, onPress, loading = false, variant = 'solid' }: Props) {
  const solid = variant === 'solid';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading, disabled: loading }}
      disabled={loading}
      onPress={onPress}
      className={`h-[52px] items-center justify-center rounded-full ${solid ? 'bg-plum' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={solid ? tokens.colors['on-dusk'] : tokens.colors.plum} />
      ) : (
        <Text className={`text-[16px] ${solid ? 'text-on-dusk' : 'text-ink-muted'}`}>{label}</Text>
      )}
    </Pressable>
  );
}
