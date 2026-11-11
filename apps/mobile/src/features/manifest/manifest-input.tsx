import { DESIRE_TEXT_MAX } from '@eloria/shared';
import { useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Icon } from '@/components/icons/icon';
import { ko } from '@/i18n/ko';
import { ApiClientError } from '@/lib/api-client';
import { shadow } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';
import { useCreateManifest } from './use-create-manifest';
import { haptic } from '@/lib/haptics';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  /** 등록에 성공하면 생성 진행 화면으로 보낼 수 있게 storyId를 넘긴다. */
  onCreated: (storyId: string) => void;
};

/** 꿈 입력창(Figma Input / Manifest): 흰 알약 + 오른쪽 원형 plum 전송 버튼 */
export function ManifestInput({ value, onChangeText, onCreated }: Props) {
  const create = useCreateManifest();
  const queryClient = useQueryClient();
  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !create.isPending;

  const send = () => {
    if (!canSend) return;
    haptic('medium');
    create.mutate(
      { text: trimmed },
      {
        onSuccess: ({ storyId }) => {
          onChangeText('');
          // 홈·저장한 이야기에 새 이야기가 바로 보이게 한다.
          void queryClient.invalidateQueries({ queryKey: ['library'] });
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
          accessibilityState={{ disabled: !canSend, busy: create.isPending }}
          disabled={!canSend}
          onPress={send}
          className={`h-11 w-11 items-center justify-center self-end rounded-full ${
            canSend || create.isPending ? 'bg-plum' : 'bg-plum/40'
          }`}
        >
          {create.isPending ? (
            <ActivityIndicator color={tokens.colors['on-photo']} />
          ) : (
            <Icon name="arrowUp" size={20} color={tokens.colors['on-photo']} />
          )}
        </Pressable>
      </View>
      {(error || value.length > 0) && (
        <View className="flex-row justify-between px-2">
          <Text accessibilityLiveRegion="polite" className={`${type.caption} flex-1 text-plum`}>
            {error ?? ''}
          </Text>
          <Text className={`${type.caption} text-ink-faint`}>
            {ko.manifest.counter(value.length, DESIRE_TEXT_MAX)}
          </Text>
        </View>
      )}
    </View>
  );
}
