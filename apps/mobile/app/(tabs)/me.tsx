import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/primary-button';
import { useAuth } from '@/features/auth/auth-provider';
import { DevStatus } from '@/features/dev/dev-status';
import {
  ChipListEditor,
  NameEditor,
  PeopleEditor,
  Section,
  TonePicker,
} from '@/features/profile/personal-editors';
import { useAddPerson, usePeople, useRemovePerson } from '@/features/profile/use-people';
import {
  useProfile,
  useSetOnboardingCompleted,
  useUpdatePersonal,
} from '@/features/profile/use-profile';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';

/**
 * 마이(PRD 6절, F-11 Personal). 여기서 바꾼 이름·톤·소중한 사람·좋아하는 것·싫어하는 것은 다음 생성부터 반영된다.
 * 나의 기록·보이스/배경 사운드 기본값·알림 시간·구독 관리·계정 삭제는 이후 작업.
 */
export default function Me() {
  const auth = useAuth();
  const profile = useProfile();
  const people = usePeople();
  const update = useUpdatePersonal();
  const addPerson = useAddPerson();
  const removePerson = useRemovePerson();
  const setOnboarding = useSetOnboardingCompleted();
  const [error, setError] = useState<string>();
  const isAnonymous = auth.status === 'signed-in' && auth.session.user.is_anonymous;

  const onError = () => setError(ko.me.saveFailed);
  const save = (patch: Parameters<typeof update.mutate>[0]) => {
    setError(undefined);
    update.mutate(patch, { onError });
  };

  if (profile.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-dawn">
        <ActivityIndicator color={tokens.colors.plum} />
      </View>
    );
  }

  const p = profile.data;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dawn">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-4 px-gutter pb-10 pt-4"
        >
          <View className="gap-1">
            <Text accessibilityRole="header" className="text-[28px] leading-[38px] text-plum-deep">
              {p?.displayName ?? ko.me.title}
            </Text>
            <Text className="text-[13px] text-ink-muted">{ko.me.subtitle}</Text>
          </View>

          {error && (
            <Text accessibilityLiveRegion="polite" className="text-[13px] text-plum">
              {error}
            </Text>
          )}

          <Section title={ko.me.name}>
            <NameEditor
              key={p?.displayName ?? ''}
              value={p?.displayName ?? ''}
              saving={update.isPending && update.variables?.displayName !== undefined}
              onSave={(displayName) => save({ displayName })}
            />
          </Section>

          <Section title={ko.me.tone}>
            <TonePicker value={p?.tone ?? null} onChange={(tone) => save({ tone })} />
          </Section>

          <Section title={ko.me.people} hint={ko.me.peopleHint}>
            <PeopleEditor
              people={people.data ?? []}
              adding={addPerson.isPending}
              onAdd={(person) => {
                setError(undefined);
                addPerson.mutate(person, { onError });
              }}
              onRemove={(id) => {
                setError(undefined);
                removePerson.mutate(id, { onError });
              }}
            />
          </Section>

          <Section title={ko.me.likes}>
            <ChipListEditor
              items={p?.likes ?? []}
              placeholder={ko.me.likesPlaceholder}
              onChange={(likes) => save({ likes })}
            />
          </Section>

          <Section title={ko.me.dislikes}>
            <ChipListEditor
              items={p?.dislikes ?? []}
              placeholder={ko.me.dislikesPlaceholder}
              onChange={(dislikes) => save({ dislikes })}
            />
          </Section>

          <Section title={ko.me.account}>
            <Text className="text-[16px] leading-[24px] text-plum-deep">
              {isAnonymous ? ko.me.accountAnonymous : ko.me.accountLinked}
            </Text>
            {isAnonymous && (
              <PrimaryButton
                label={ko.me.linkAccount}
                onPress={() => router.push('/link-account')}
              />
            )}
          </Section>

          {__DEV__ && (
            <>
              <DevStatus />
              <PrimaryButton
                variant="ghost"
                label={ko.me.restartOnboarding}
                loading={setOnboarding.isPending}
                onPress={() =>
                  setOnboarding.mutate(false, { onSuccess: () => router.replace('/') })
                }
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
