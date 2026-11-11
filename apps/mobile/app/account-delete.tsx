import { DELETE_REASONS, type AccountDeleteRequest } from '@eloria/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayer } from '@/audio/player-provider';
import { usePlayerStore } from '@/audio/player-store';
import { DawnBackdrop } from '@/components/backgrounds';
import { Icon } from '@/components/icons/icon';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { ko } from '@/i18n/ko';
import { authedApi } from '@/lib/authed-api';
import { haptic } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { dawnScreen, shadow } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

type Reason = (typeof DELETE_REASONS)[number];
const t = ko.deleteAccount;

/**
 * 회원 탈퇴(Figma P04, PRD F-14). 안내를 확인해야 탈퇴할 수 있고, 사유는 선택.
 * 서버(POST /v1/account/delete)가 파일·데이터·계정을 지운 뒤 로그아웃한다.
 */
export default function AccountDelete() {
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const queryClient = useQueryClient();
  const { unloadIfCurrent } = usePlayer();
  const track = usePlayerStore((s) => s.track);

  const remove = useMutation({
    mutationFn: async () => {
      const body: AccountDeleteRequest = { reasons };
      await authedApi('/v1/account/delete', { method: 'POST', body });
      if (track) unloadIfCurrent(track.storyId);
      await supabase.auth.signOut();
      queryClient.clear();
    },
    onSuccess: () => router.replace('/'),
    onError: () => haptic('error'),
  });

  const toggle = (r: Reason) => {
    haptic('selection');
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <DawnBackdrop style={dawnScreen} />
        <SafeAreaView edges={['top', 'bottom']} className="flex-1 px-gutter pb-[30px] pt-2">
          <ScreenHeader title={t.title} />
          <Text accessibilityRole="header" className={`${type.h2} mt-6 text-plum-deep`}>
            {t.heading}
          </Text>

          <View
            className="mt-4 gap-[14px] rounded-[22px] border border-glass-border bg-glass p-5"
            style={shadow.glass}
          >
            {t.bullets.map((b) => (
              <View key={b} className="flex-row gap-[10px]">
                <View className="h-5 w-[6px] justify-center">
                  <View className="h-[6px] w-[6px] rounded-full bg-plum" />
                </View>
                <Text className={`${type.body} flex-1 text-plum-deep/85`}>{b}</Text>
              </View>
            ))}
          </View>

          <Text className={`${type.caption} mt-6 text-plum-deep/70`}>{t.reasonLabel}</Text>
          <View className="mt-[10px] flex-row flex-wrap gap-2">
            {DELETE_REASONS.map((r) => {
              const on = reasons.includes(r);
              return (
                <Pressable
                  key={r}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={t.reasons[r]}
                  onPress={() => toggle(r)}
                  className={`rounded-full px-[14px] py-[9px] ${
                    on ? 'bg-plum' : 'border border-glass-border bg-glass'
                  }`}
                  style={on ? undefined : shadow.glass}
                >
                  <Text className={`${type.caption} ${on ? 'text-on-photo' : 'text-plum-deep'}`}>
                    {t.reasons[r]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: confirmed }}
            accessibilityLabel={t.confirm}
            onPress={() => {
              haptic('selection');
              setConfirmed((v) => !v);
            }}
            className="mt-6 flex-row items-center gap-[10px] self-start"
          >
            <View
              className={`h-[22px] w-[22px] items-center justify-center rounded-md ${
                confirmed ? 'bg-plum' : 'border-[1.5px] border-plum-deep/30'
              }`}
            >
              {confirmed && <Icon name="checkSmall" size={14} color={tokens.colors['on-photo']} />}
            </View>
            <Text className={`${type.body} text-plum-deep/90`}>{t.confirm}</Text>
          </Pressable>

          <View className="min-h-8 flex-1" />

          {remove.isError && (
            <Text
              accessibilityLiveRegion="polite"
              className={`${type.caption} mb-2 text-center text-plum`}
            >
              {t.failed}
            </Text>
          )}
          <PrimaryButton label={t.keep} onPress={() => router.back()} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.delete}
            accessibilityState={{ disabled: !confirmed || remove.isPending }}
            disabled={!confirmed || remove.isPending}
            onPress={() => {
              haptic('warning');
              remove.mutate();
            }}
            className="mt-2 items-center py-[14px]"
          >
            <Text
              className={`${type.body} ${confirmed ? 'text-plum-deep/70' : 'text-plum-deep/30'}`}
            >
              {remove.isPending ? ko.common.loading : t.delete}
            </Text>
          </Pressable>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
