import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/primary-button';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

/** 아래에서 올라오는 편집 시트(Figma P03 사람 추가). 배경을 누르면 닫힌다. */
export function EditSheet({
  visible,
  title,
  description,
  submitLabel,
  canSubmit,
  pending,
  onSubmit,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  description?: string;
  submitLabel: string;
  canSubmit: boolean;
  pending?: boolean;
  onSubmit: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ko.common.close}
          onPress={onClose}
          className="flex-1 bg-twilight/40"
        />
        <View
          className="rounded-t-sheet bg-pearl px-gutter pt-3"
          style={{ paddingBottom: insets.bottom + 24 }}
        >
          <View className="items-center">
            <View className="h-1 w-9 rounded-full bg-plum-deep/20" />
          </View>
          <Text accessibilityRole="header" className={`${type.h2} mt-4 text-plum-deep`}>
            {title}
          </Text>
          {description && (
            <Text className={`${type.caption} mt-[6px] text-ink-soft`}>{description}</Text>
          )}
          <View className="mt-5 gap-2">{children}</View>
          <View className="mt-[18px]">
            <PrimaryButton
              label={submitLabel}
              disabled={!canSubmit}
              loading={pending}
              onPress={onSubmit}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function FieldLabel({ children }: { children: string }) {
  return <Text className={`${type.caption} mt-2 text-plum/85`}>{children}</Text>;
}

/** 시트 안의 입력창(흰 바탕, 연한 테두리) */
export function SheetInput(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={tokens.colors['ink-faint']}
      className={`${type.body} rounded-field border border-plum/15 bg-on-photo px-[17px] py-4 text-plum-deep`}
    />
  );
}

/** 하나만 고르는 칩 묶음(관계, 성별) */
export function ChoiceChips<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string }[];
  value: K | undefined;
  onChange: (key: K) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
      {options.map((o) => {
        const selected = value === o.key;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.key)}
            className={`rounded-full px-4 py-[9px] ${
              selected
                ? 'border-[1.5px] border-plum bg-on-photo'
                : 'border border-plum/15 bg-on-photo/70'
            }`}
          >
            <Text
              className={selected ? `${type.bodyMedium} text-plum` : `${type.body} text-plum-deep`}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
