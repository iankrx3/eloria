import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SLEEP_OPTIONS, useSleepTimer } from '@/audio/sleep-timer';
import { DawnBackdrop, GLOW } from '@/components/backgrounds';
import { ScreenHeader } from '@/components/screen-header';
import { Toggle } from '@/components/toggle';
import { ListGroup, ListRow, SectionLabel } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { ChoiceChips, EditSheet } from '@/features/profile/edit-sheet';
import { useMarketingConsent } from '@/features/profile/use-consent';
import { useProfile, useUpdateSettings } from '@/features/profile/use-profile';
import { useSelectSoundscape, useSoundscapes } from '@/features/soundscape/use-soundscapes';
import { useCurrentVoice, VoiceSheet } from '@/features/voice/voice-sheet';
import { ko } from '@/i18n/ko';
import { useHapticSettings } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { dawnScreenLong } from '@/theme/effects';
import { type } from '@/theme/typography';

const t = ko.settings;

/** 확언 알림 시간 선택지(기본 오전 8시, Figma A03 노트) */
const AFFIRMATION_TIMES = ['07:00', '08:00', '09:00', '12:00', '21:00', '22:00'] as const;

function timeLabel(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  return t.timeLabel(h, m);
}

// 스토어 정책: 구독 해지는 앱 안에서 하지 않고 스토어 구독 관리로 보낸다(Figma P02 노트).
const SUBSCRIPTIONS_URL = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  default: 'https://play.google.com/store/account/subscriptions',
});

type Sheet = 'time' | 'soundscape' | 'sleep' | null;

/** 설정(Figma P02). 계정 · 구독 · 알림 · 재생 · 앱 · 고객지원 · 약관 · 로그아웃/탈퇴 */
export default function Settings() {
  const auth = useAuth();
  const profile = useProfile();
  const update = useUpdateSettings();
  const marketing = useMarketingConsent();
  const voice = useCurrentVoice();
  const soundscapes = useSoundscapes();
  const selectSoundscape = useSelectSoundscape();
  const haptics = useHapticSettings();
  const sleep = useSleepTimer();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const session = auth.status === 'signed-in' ? auth.session : null;
  const isAnonymous = session?.user.is_anonymous ?? true;
  const p = profile.data;
  const notifyAt = (p?.affirmationNotifyAt ?? '08:00').slice(0, 5);
  const currentSoundscape = soundscapes.data?.find((s) => s.id === p?.preferredSoundscapeId);

  const logout = () =>
    Alert.alert(t.logoutTitle, isAnonymous ? t.logoutAnonymous : undefined, [
      { text: ko.common.cancel, style: 'cancel' },
      {
        text: t.logoutConfirm,
        style: 'destructive',
        onPress: () => {
          void supabase.auth.signOut().then(() => router.replace('/'));
        },
      },
    ]);

  const legal = (doc: string) => router.push({ pathname: '/legal/[doc]', params: { doc } });

  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <DawnBackdrop
          style={dawnScreenLong}
          glows={[
            { x: 170, y: -60, width: 260, ...GLOW.pinkWide },
            { x: -110, y: 700, width: 260, ...GLOW.periwinkleWide },
          ]}
        />
        <SafeAreaView edges={['top', 'bottom']} className="px-gutter pb-8 pt-2">
          <ScreenHeader title={t.title} />

          <View className="mt-6 gap-[10px]">
            <SectionLabel icon="sparkle" label={t.account} />
            <ListGroup>
              <ListRow label={t.email} value={session?.user.email ?? '—'} chevron={false} />
              <ListRow
                label={t.loginMethod}
                value={isAnonymous ? t.loginAnonymous : t.loginKakao}
                onPress={isAnonymous ? () => router.push('/link-account') : undefined}
                last
              />
            </ListGroup>
          </View>

          <View className="mt-[26px] gap-[10px]">
            <SectionLabel icon="sparkle" label={t.subscription} />
            <ListGroup>
              <ListRow label={t.plan} value={t.planFree} onPress={() => router.push('/paywall')} />
              <ListRow label={t.billing} value={t.pending} chevron={false} />
              <ListRow
                label={t.cancelHow}
                sub={Platform.OS === 'ios' ? t.cancelHowSubIos : t.cancelHowSub}
                onPress={() => void Linking.openURL(SUBSCRIPTIONS_URL)}
                last
              />
            </ListGroup>
          </View>

          <View className="mt-[26px] gap-[10px]">
            <SectionLabel icon="sparkle" label={t.notifications} />
            <ListGroup>
              <ListRow
                label={t.notifyAffirmation}
                sub={t.notifyAffirmationSub(timeLabel(notifyAt))}
                onPress={() => setSheet('time')}
                chevron={false}
                right={
                  <Toggle
                    label={t.notifyAffirmation}
                    value={p?.notifyAffirmation ?? true}
                    onChange={(v) => update.mutate({ notifyAffirmation: v })}
                  />
                }
              />
              <ListRow
                label={t.notifyStory}
                chevron={false}
                right={
                  <Toggle
                    label={t.notifyStory}
                    value={p?.notifyStory ?? true}
                    onChange={(v) => update.mutate({ notifyStory: v })}
                  />
                }
              />
              <ListRow
                label={t.notifyChallenge}
                chevron={false}
                right={
                  <Toggle
                    label={t.notifyChallenge}
                    value={p?.notifyChallenge ?? false}
                    onChange={(v) => update.mutate({ notifyChallenge: v })}
                  />
                }
              />
              <ListRow
                label={t.notifyMarketing}
                sub={t.notifyMarketingSub}
                chevron={false}
                last
                right={
                  <Toggle
                    label={t.notifyMarketing}
                    value={marketing.granted}
                    disabled={marketing.isPending || marketing.set.isPending}
                    onChange={(v) => marketing.set.mutate(v)}
                  />
                }
              />
            </ListGroup>
          </View>

          <View className="mt-[26px] gap-[10px]">
            <SectionLabel icon="sparkle" label={t.playback} />
            <ListGroup>
              <ListRow
                label={t.narrator}
                value={voice?.name ?? ko.voice.defaultName}
                onPress={() => setVoiceOpen(true)}
              />
              <ListRow
                label={t.soundscape}
                value={currentSoundscape?.name ?? ko.player.soundscapeNone}
                onPress={() => setSheet('soundscape')}
              />
              <ListRow
                label={t.sleepTimer}
                value={t.sleepOptions[String(sleep.minutes === 0 ? 'off' : sleep.minutes)]}
                onPress={() => setSheet('sleep')}
                last
              />
            </ListGroup>
          </View>

          <View className="mt-[26px] gap-[10px]">
            <SectionLabel icon="sparkle" label={t.app} />
            <ListGroup>
              <ListRow
                label={t.haptics}
                chevron={false}
                right={
                  <Toggle label={t.haptics} value={haptics.enabled} onChange={haptics.setEnabled} />
                }
              />
              <ListRow label={t.language} value={t.languageKo} chevron={false} last />
            </ListGroup>
          </View>

          <View className="mt-[26px] gap-[10px]">
            <SectionLabel icon="sparkle" label={t.support} />
            <ListGroup>
              <ListRow label={t.faq} onPress={() => legal('faq')} />
              <ListRow label={t.contact} onPress={() => legal('contact')} last />
            </ListGroup>
          </View>

          <View className="mt-[26px] gap-[10px]">
            <SectionLabel icon="sparkle" label={t.legal} />
            <ListGroup>
              <ListRow label={t.terms} onPress={() => legal('terms')} />
              <ListRow label={t.privacy} onPress={() => legal('privacy')} />
              <ListRow label={t.overseas} onPress={() => legal('overseas')} />
              <ListRow label={t.aiNotice} onPress={() => legal('ai')} />
              <ListRow label={t.licenses} onPress={() => legal('licenses')} last />
            </ListGroup>
          </View>

          <View className="mt-[26px]">
            <ListGroup>
              <ListRow label={t.logout} chevron={false} onPress={logout} />
              <ListRow
                label={t.deleteAccount}
                onPress={() => router.push('/account-delete')}
                last
              />
            </ListGroup>
          </View>

          <Text className={`${type.caption} mt-5 text-ink-faint`}>
            {t.version(Constants.expoConfig?.version ?? '')}
          </Text>
        </SafeAreaView>
      </ScrollView>

      {sheet === 'time' && (
        <ChoiceSheet
          title={t.timeTitle}
          options={AFFIRMATION_TIMES.map((v) => ({ key: v, label: timeLabel(v) }))}
          value={notifyAt}
          onSave={(v) =>
            update.mutate({ affirmationNotifyAt: v }, { onSuccess: () => setSheet(null) })
          }
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'soundscape' && (
        <ChoiceSheet
          title={t.soundscape}
          options={[
            { key: 'none', label: ko.player.soundscapeNone },
            ...(soundscapes.data ?? []).map((s) => ({ key: s.id, label: s.name })),
          ]}
          value={currentSoundscape?.id ?? 'none'}
          onSave={(id) => {
            const option = soundscapes.data?.find((s) => s.id === id) ?? null;
            selectSoundscape.mutate(option, { onSuccess: () => setSheet(null) });
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'sleep' && (
        <ChoiceSheet
          title={t.sleepTimer}
          options={SLEEP_OPTIONS.map((m) => ({
            key: String(m),
            label: t.sleepOptions[m === 0 ? 'off' : String(m)] ?? String(m),
          }))}
          value={String(sleep.minutes)}
          onSave={(v) => {
            sleep.setMinutes(Number(v) as (typeof SLEEP_OPTIONS)[number]);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
      <VoiceSheet visible={voiceOpen} onClose={() => setVoiceOpen(false)} />
    </View>
  );
}

/** 하나를 고르고 저장하는 시트(알림 시간·배경음·수면 타이머) */
function ChoiceSheet({
  title,
  options,
  value,
  onSave,
  onClose,
}: {
  title: string;
  options: { key: string; label: string }[];
  value: string;
  onSave: (key: string) => void;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState(value);
  return (
    <EditSheet
      visible
      title={title}
      submitLabel={ko.me.sheet.save}
      canSubmit
      onSubmit={() => onSave(picked)}
      onClose={onClose}
    >
      <ChoiceChips options={options} value={picked} onChange={setPicked} />
    </EditSheet>
  );
}
