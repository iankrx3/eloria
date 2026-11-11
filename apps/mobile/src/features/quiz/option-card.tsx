import { Pressable, Text, TextInput, type TextInputProps } from 'react-native';
import { Icon } from '@/components/icons/icon';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

const GLASS = 'border border-on-photo/70 bg-on-photo/50';
const PICKED = 'border-[1.5px] border-plum bg-pearl/90';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

/** 객관식 보기(Figma Quiz / Option). 기본은 흰 50% 유리, 고르면 pearl 92% + plum 테두리 + plum Medium. */
export function OptionCard({ label, selected, onPress, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-field py-[18px] pl-[22px] pr-[18px] ${
        selected ? PICKED : GLASS
      }`}
    >
      <Text
        className={`flex-1 ${selected ? `${type.bodyMedium} text-plum` : `${type.body} text-plum-deep`}`}
      >
        {label}
      </Text>
      <Icon
        name="chevronRight"
        size={18}
        color={selected ? tokens.colors.plum : tokens.colors['plum-deep']}
      />
    </Pressable>
  );
}

/** 복수 선택 칸(Figma Quiz / Grid Cell). full이면 한 줄 전체를 쓴다. */
export function GridCell({ label, selected, onPress, full = false }: Props & { full?: boolean }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={`h-14 items-center justify-center rounded-[14px] ${selected ? PICKED : GLASS}`}
      style={{ width: full ? '100%' : '48%' }}
    >
      <Text className={selected ? `${type.bodyMedium} text-plum` : `${type.body} text-plum-deep`}>
        {label}
      </Text>
    </Pressable>
  );
}

/** 유리 입력창(Figma Quiz / Input, Quiz / Textarea) */
export function GlassInput({ multiline, ...props }: TextInputProps) {
  return (
    <TextInput
      {...props}
      multiline={multiline}
      placeholderTextColor="rgba(62, 42, 79, 0.5)"
      textAlignVertical={multiline ? 'top' : 'center'}
      className={`rounded-field px-5 py-[18px] text-plum-deep ${type.body} ${GLASS} ${
        multiline ? 'h-28' : ''
      }`}
    />
  );
}
