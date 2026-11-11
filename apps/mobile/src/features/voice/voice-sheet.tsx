import { NARRATOR_SPEEDS } from '@eloria/shared';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons/icon';
import { PrimaryButton } from '@/components/primary-button';
import { useProfile, useUpdateSettings } from '@/features/profile/use-profile';
import { ko } from '@/i18n/ko';
import { haptic } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { shadow } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

export type Voice = { id: string; key: string; name: string; previewPath: string | null };

// 아바타 그라디언트(Figma H10, 목소리 순서대로)
const AVATARS = [
  'linear-gradient(135deg, #F6C9DA 14%, #C9B3DE 86%)',
  'linear-gradient(135deg, #F2C185 14%, #E39AAE 86%)',
  'linear-gradient(135deg, #CCD6F2 14%, #E6D9F0 86%)',
  'linear-gradient(135deg, #B7C3E8 14%, #8E7CB3 86%)',
];

/** 공용 내레이터 목소리(voices, RLS: 공용·본인). 순서는 시드 순서(만든 시각) */
export function useVoices() {
  return useQuery({
    queryKey: ['voices'],
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<Voice[]> => {
      const { data, error } = await supabase
        .from('voices')
        .select('id, key, display_name, preview_path')
        .is('owner_user_id', null)
        .order('created_at');
      if (error) throw error;
      return data.map((v) => ({
        id: v.id,
        key: v.key,
        name: v.display_name,
        previewPath: v.preview_path,
      }));
    },
  });
}

/** 지금 고른 목소리(없으면 첫 번째) */
export function useCurrentVoice() {
  const voices = useVoices();
  const preferred = useProfile().data?.preferredVoiceId ?? null;
  const list = voices.data ?? [];
  return list.find((v) => v.id === preferred) ?? list[0] ?? null;
}

/** 목소리 고르기 바텀시트(Figma H10). 선택은 다음 이야기부터 적용된다. */
export function VoiceSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const voices = useVoices();
  const profile = useProfile();
  const update = useUpdateSettings();
  const current = useCurrentVoice();
  const [picked, setPicked] = useState<string | null>(null);
  const [speed, setSpeed] = useState<number>(1.0);
  const [notice, setNotice] = useState(false);

  useEffect(() => {
    if (visible) {
      setPicked(current?.id ?? null);
      setSpeed(profile.data?.narratorSpeed ?? 1.0);
      setNotice(false);
    }
  }, [visible, current?.id, profile.data?.narratorSpeed]);

  const save = () => {
    if (!picked) return;
    update.mutate(
      { preferredVoiceId: picked, narratorSpeed: speed as 0.9 | 1.0 | 1.1 },
      {
        onSuccess: () => {
          haptic('success');
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ko.common.close}
        onPress={onClose}
        className="flex-1 bg-twilight/45"
      />
      <View
        className="rounded-t-[24px] px-gutter pt-3"
        style={{
          paddingBottom: insets.bottom + 34,
          experimental_backgroundImage: 'linear-gradient(180deg, #F6F0FA 0%, #E9DDF3 100%)',
        }}
      >
        <View className="items-center">
          <View className="h-1 w-9 rounded-full bg-plum-deep/20" />
        </View>
        <Text accessibilityRole="header" className={`${type.h2} mt-4 text-plum-deep`}>
          {ko.voice.title}
        </Text>
        <Text className={`${type.caption} mt-[6px] text-ink-soft`}>{ko.voice.subtitle}</Text>

        <View accessibilityRole="radiogroup" className="mt-[18px] gap-[10px]">
          {voices.isPending && <ActivityIndicator color={tokens.colors.plum} />}
          {(voices.data ?? []).map((v, i) => {
            const selected = picked === v.id;
            return (
              <Pressable
                key={v.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={v.name}
                onPress={() => {
                  haptic('selection');
                  setPicked(v.id);
                }}
                className={`flex-row items-center gap-3 rounded-[20px] px-[14px] py-3 ${
                  selected
                    ? 'border-[1.5px] border-plum bg-on-photo/90'
                    : 'border border-glass-border bg-on-photo/55'
                }`}
                style={shadow.glass}
              >
                <View
                  className="h-11 w-11 items-center justify-center rounded-full"
                  style={{ experimental_backgroundImage: AVATARS[i % AVATARS.length] }}
                >
                  <Icon name="voice" size={18} color={tokens.colors['on-photo']} />
                </View>
                <View className="flex-1 gap-[2px]">
                  <Text className={`${type.bodyMedium} text-plum-deep`}>{v.name}</Text>
                  <Text className={`${type.caption} text-ink-soft`}>
                    {ko.voice.descriptions[v.key] ?? ''}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={ko.voice.sample(v.name)}
                  hitSlop={6}
                  onPress={() => {
                    haptic('light');
                    // 미리듣기 음원은 ElevenLabs 보이스가 정해진 뒤 voice-previews 버킷에 올린다(Q-08).
                    setNotice(true);
                  }}
                  className="h-9 w-9 items-center justify-center rounded-full bg-plum/10"
                >
                  <Icon name="play" size={14} color={tokens.colors['plum-deep']} />
                </Pressable>
                <View
                  className={`h-[22px] w-[22px] items-center justify-center rounded-full ${
                    selected ? 'bg-plum' : 'border-[1.5px] border-plum-deep/25'
                  }`}
                >
                  {selected && (
                    <Icon name="checkSmall" size={12} color={tokens.colors['on-photo']} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
        {notice && (
          <Text accessibilityLiveRegion="polite" className={`${type.caption} mt-2 text-plum`}>
            {ko.voice.sampleSoon}
          </Text>
        )}

        <Text className={`${type.caption} mt-5 text-plum-deep/70`}>{ko.voice.speed}</Text>
        <View accessibilityRole="radiogroup" className="mt-2 flex-row gap-2">
          {NARRATOR_SPEEDS.map((s) => {
            const selected = speed === s;
            return (
              <Pressable
                key={s}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={ko.voice.speedLabel(s)}
                onPress={() => {
                  haptic('selection');
                  setSpeed(s);
                }}
                className={`flex-row items-center gap-[6px] rounded-full px-[14px] py-2 ${
                  selected ? 'bg-plum' : 'border border-glass-border bg-glass'
                }`}
              >
                {selected && <Icon name="checkSmall" size={12} color={tokens.colors['on-photo']} />}
                <Text
                  className={`${type.caption} ${selected ? 'text-on-photo' : 'text-plum-deep'}`}
                >
                  {ko.voice.speedLabel(s)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-6">
          <PrimaryButton
            label={ko.voice.save}
            disabled={!picked}
            loading={update.isPending}
            haptic={null}
            onPress={save}
          />
        </View>
      </View>
    </Modal>
  );
}
