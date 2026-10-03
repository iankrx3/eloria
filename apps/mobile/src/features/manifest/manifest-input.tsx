import { DESIRE_TEXT_MAX } from '@eloria/shared';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { ko } from '@/i18n/ko';
import { ApiClientError } from '@/lib/api-client';
import tokens from '@/theme/tokens.json';
import { useCreateManifest } from './use-create-manifest';

type Props = {
  /** 등록에 성공하면 생성 진행 화면으로 보낼 수 있게 storyId를 넘긴다. */
  onCreated: (storyId: string) => void;
  autoFocus?: boolean;
};

/** 꿈 입력창(DESIGN 4절 홈: 둥근 입력창 + 오른쪽 원형 plum 전송 버튼). 온보딩 첫 꿈과 홈에서 같이 쓴다. */
export function ManifestInput({ onCreated, autoFocus = false }: Props) {
  const [text, setText] = useState('');
  const create = useCreateManifest();
  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !create.isPending;

  const send = () => {
    if (!canSend) return;
    create.mutate(
      { text: trimmed },
      {
        onSuccess: ({ storyId }) => {
          setText('');
          onCreated(storyId);
        },
        onError: (e) => {
          if (__DEV__) console.warn('[manifest] create failed', e);
        },
      },
    );
  };

  const error =
    create.error instanceof ApiClientError && create.error.code === 'RATE_LIMITED'
      ? ko.manifest.rateLimited
      : create.isError
        ? ko.manifest.failed
        : undefined;

  return (
    <View className="gap-2">
      <View className="min-h-[56px] flex-row items-center gap-2 rounded-field bg-surface pl-4 pr-2">
        <TextInput
          value={text}
          onChangeText={setText}
          maxLength={DESIRE_TEXT_MAX}
          placeholder={ko.home.placeholder}
          placeholderTextColor={tokens.colors['ink-muted']}
          accessibilityLabel={ko.home.placeholder}
          autoFocus={autoFocus}
          multiline
          className="max-h-[120px] flex-1 py-3 text-[16px] leading-[24px] text-plum-deep"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ko.manifest.submit}
          accessibilityState={{ disabled: !canSend, busy: create.isPending }}
          disabled={!canSend}
          onPress={send}
          className={`h-10 w-10 items-center justify-center rounded-full ${canSend ? 'bg-plum' : 'bg-dawn-2'}`}
        >
          {create.isPending ? (
            <ActivityIndicator color={tokens.colors['on-dusk']} />
          ) : (
            <SymbolView
              name={{ ios: 'arrow.up', android: 'arrow_upward' }}
              size={20}
              tintColor={canSend ? tokens.colors['on-dusk'] : tokens.colors['ink-muted']}
            />
          )}
        </Pressable>
      </View>
      <View className="flex-row justify-between px-1">
        <Text accessibilityLiveRegion="polite" className="flex-1 text-[13px] text-plum">
          {error ?? ''}
        </Text>
        <Text className="text-[13px] text-ink-muted">
          {ko.manifest.counter(text.length, DESIRE_TEXT_MAX)}
        </Text>
      </View>
    </View>
  );
}
