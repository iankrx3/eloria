import { DESIRE_TEXT_MAX } from '@eloria/shared';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Icon } from '@/components/icons/icon';
import { ko } from '@/i18n/ko';
import { haptic } from '@/lib/haptics';
import { shadow } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  /** 전송하면 꿈 문장을 넘긴다. 홈은 비전 고르기(H04 → H05)로 보낸다. */
  onSubmit: (text: string) => void;
};

/** 꿈 입력창(Figma Input / Manifest): 흰 알약 + 오른쪽 원형 plum 전송 버튼 */
export function ManifestInput({ value, onChangeText, onSubmit }: Props) {
  const trimmed = value.trim();
  const canSend = trimmed.length > 0;

  const send = () => {
    if (!canSend) return;
    haptic('medium');
    onSubmit(trimmed);
    onChangeText('');
  };

  return (
    <View className="gap-2">
      <View
        className="min-h-[60px] flex-row items-center gap-[10px] rounded-[30px] border border-on-photo bg-glass-strong py-2 pl-5 pr-2"
        style={shadow.input}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          maxLength={DESIRE_TEXT_MAX}
          placeholder={ko.home.placeholder}
          placeholderTextColor={tokens.colors['ink-faint']}
          accessibilityLabel={ko.home.placeholder}
          multiline
          className={`${type.body} max-h-[96px] flex-1 py-2 text-plum-deep`}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ko.manifest.submit}
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          onPress={send}
          className={`h-11 w-11 items-center justify-center self-end rounded-full ${
            canSend ? 'bg-plum' : 'bg-plum/40'
          }`}
        >
          <Icon name="arrowUp" size={20} color={tokens.colors['on-photo']} />
        </Pressable>
      </View>
      {value.length > 0 && (
        <View className="flex-row justify-end px-2">
          <Text className={`${type.caption} text-ink-faint`}>
            {ko.manifest.counter(value.length, DESIRE_TEXT_MAX)}
          </Text>
        </View>
      )}
    </View>
  );
}
