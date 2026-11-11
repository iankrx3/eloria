import { Pressable, View } from 'react-native';
import { haptic } from '@/lib/haptics';

/** 켜고 끄는 스위치(Figma Toggle 46×28). 켜짐 = plum, 꺼짐 = 옅은 회보라 */
export function Toggle({
  value,
  onChange,
  label,
  disabled,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        haptic('selection');
        onChange(!value);
      }}
      className={`h-7 w-[46px] justify-center rounded-full px-[3px] ${
        value ? 'bg-plum' : 'bg-plum-deep/15'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <View
        className={`h-[22px] w-[22px] rounded-full bg-on-photo ${value ? 'self-end' : 'self-start'}`}
        style={{ boxShadow: '0px 1px 3px 0px rgba(31,26,51,0.2)' }}
      />
    </Pressable>
  );
}
