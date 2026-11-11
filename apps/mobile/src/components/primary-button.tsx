import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/icons/icon';
import { shadow } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

type Variant = 'plum' | 'pearl' | 'ghost' | 'ghost-photo';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /**
   * plum = 밝은 화면의 주 버튼(Button / Primary)
   * pearl = 사진 위 주 버튼(Quiz / Continue Button). 비활성이면 반투명 유리로 바뀐다.
   * ghost = 밝은 화면의 글자 버튼, ghost-photo = 사진 위 글자 버튼
   */
  variant?: Variant;
  /** 글자 오른쪽 화살표(Button / Primary "스토리 만들기 >") */
  chevron?: boolean;
};

const STYLE: Record<Variant, { box: string; text: string; spinner: string }> = {
  plum: { box: 'bg-plum', text: 'text-on-photo', spinner: tokens.colors['on-photo'] },
  pearl: { box: 'bg-pearl', text: 'text-plum-deep', spinner: tokens.colors.plum },
  ghost: { box: '', text: 'text-ink-soft', spinner: tokens.colors.plum },
  'ghost-photo': { box: '', text: 'text-on-photo/90', spinner: tokens.colors['on-photo'] },
};

/** 둥근 알약 버튼(Figma Button / Primary, Quiz / Continue Button). 그라디언트는 쓰지 않는다. */
export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'plum',
  chevron = false,
}: Props) {
  const inactive = disabled || loading;
  const glassDisabled = disabled && variant === 'pearl';
  const s = STYLE[variant];
  const box = glassDisabled ? 'border border-on-photo/60 bg-on-photo/40' : s.box;
  const text = glassDisabled ? 'text-ink-faint' : s.text;
  const elevation =
    glassDisabled || variant.startsWith('ghost')
      ? undefined
      : variant === 'plum'
        ? shadow.plumButton
        : shadow.pearlButton;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading, disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      className={`h-14 flex-row items-center justify-center gap-2 rounded-full px-6 ${box}`}
      style={elevation}
    >
      {loading ? (
        <ActivityIndicator color={s.spinner} />
      ) : (
        <View className="flex-row items-center gap-2">
          <Text className={`${type.bodyMedium} ${text}`}>{label}</Text>
          {chevron && (
            <Icon
              name="chevronRight"
              size={18}
              color={variant === 'plum' ? tokens.colors['on-photo'] : tokens.colors['plum-deep']}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}
