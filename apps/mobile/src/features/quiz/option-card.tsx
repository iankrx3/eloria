import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { GlassFill } from '@/components/glass';
import { Icon } from '@/components/icons/icon';
import { haptic } from '@/lib/haptics';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

// Figma Quiz / Option·Grid Cell: 기본 = 흰 50% 유리(blur 10) + 흰 70% 테두리, 선택 = pearl 92%(blur 12) + plum 1.5 테두리
const GLASS_FILL = 'rgba(255, 255, 255, 0.5)';
const PICKED_FILL = 'rgba(247, 242, 250, 0.92)';
const GLASS_BORDER = 'border border-on-photo/70';
const PICKED_BORDER = 'border-[1.5px] border-plum';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

/** 객관식 보기(Figma Quiz / Option). 고르면 흰 바탕 + plum 테두리 + plum Medium. */
export function OptionCard({ label, selected, onPress, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => {
        haptic('selection');
        onPress();
      }}
      className={`flex-row items-center gap-3 overflow-hidden rounded-field py-[18px] pl-[22px] pr-[18px] ${
        selected ? PICKED_BORDER : GLASS_BORDER
      }`}
    >
      <GlassFill blur={selected ? 12 : 10} fill={selected ? PICKED_FILL : GLASS_FILL} />
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

/** 복수 선택 칸(Figma Quiz / Grid Cell 150×56, 두 칸 사이 12) */
export function GridCell({ label, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={() => {
        haptic('selection');
        onPress();
      }}
      className={`h-14 items-center justify-center overflow-hidden rounded-[14px] ${
        selected ? PICKED_BORDER : GLASS_BORDER
      }`}
      style={{ width: '48.07%' }}
    >
      <GlassFill blur={selected ? 12 : 10} fill={selected ? PICKED_FILL : GLASS_FILL} />
      <Text className={selected ? `${type.bodyMedium} text-plum` : `${type.body} text-plum-deep`}>
        {label}
      </Text>
    </Pressable>
  );
}

/** 유리 입력창(Figma Quiz / Input 한 줄, Quiz / Textarea 112) */
export function GlassInput({ multiline, ...props }: TextInputProps) {
  return (
    <View className={`overflow-hidden rounded-field ${GLASS_BORDER} ${multiline ? 'h-28' : ''}`}>
      <GlassFill blur={10} fill={GLASS_FILL} />
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor="rgba(62, 42, 79, 0.5)"
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`px-5 py-[18px] text-plum-deep ${type.body} ${multiline ? 'h-full' : ''}`}
      />
    </View>
  );
}
