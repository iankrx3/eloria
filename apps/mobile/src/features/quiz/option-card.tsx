import { SymbolView } from 'expo-symbols';
import { Pressable, Text } from 'react-native';
import tokens from '@/theme/tokens.json';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** 단일 선택은 누르면 바로 다음 문항으로 가므로 화살표를, 복수 선택은 체크를 보여 준다. */
  mode: 'single' | 'multi';
  disabled?: boolean;
};

/** 반투명 선택지 카드(DESIGN 4절). */
export function OptionCard({ label, selected, onPress, mode, disabled }: Props) {
  const icon =
    mode === 'single'
      ? ({ ios: 'chevron.right', android: 'chevron_right' } as const)
      : selected
        ? ({ ios: 'checkmark.circle.fill', android: 'check_circle' } as const)
        : ({ ios: 'circle', android: 'radio_button_unchecked' } as const);

  return (
    <Pressable
      accessibilityRole={mode === 'single' ? 'button' : 'checkbox'}
      accessibilityLabel={label}
      accessibilityState={{ selected, checked: mode === 'multi' ? selected : undefined, disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-[56px] flex-row items-center justify-between rounded-field border px-4 ${
        selected ? 'border-plum bg-surface' : 'border-rose bg-surface'
      }`}
    >
      <Text className={`flex-1 text-[16px] ${selected ? 'text-plum' : 'text-plum-deep'}`}>
        {label}
      </Text>
      <SymbolView
        name={icon}
        size={20}
        tintColor={selected ? tokens.colors.plum : tokens.colors['ink-muted']}
      />
    </Pressable>
  );
}
