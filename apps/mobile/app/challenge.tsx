import { CHALLENGE_DAYS } from '@eloria/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DawnBackdrop, GLOW } from '@/components/backgrounds';
import { Icon } from '@/components/icons/icon';
import { PrimaryButton } from '@/components/primary-button';
import { SectionLabel } from '@/components/ui';
import {
  useChallenge,
  useCompleteMission,
  useStartChallenge,
  type Mission,
} from '@/features/activity/use-activity';
import { EditSheet, SheetInput } from '@/features/profile/edit-sheet';
import { ko } from '@/i18n/ko';
import { dawnScreen, shadow } from '@/theme/effects';
import { challengeHeroImage } from '@/theme/images';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

const heroOverlay = {
  experimental_backgroundImage:
    'linear-gradient(180deg, rgba(46,33,64,0.45) 0%, rgba(46,33,64,0) 35%, rgba(46,33,64,0.75) 100%)',
};

function kindLabel(kind: string) {
  return (ko.challenge.kinds as Record<string, string>)[kind] ?? kind;
}

/** 21일 챌린지(Figma H12): 사진 머리 · 진행 21칸 · 오늘의 미션 · 챌린지 방법 */
export default function Challenge() {
  const insets = useSafeAreaInsets();
  const { state, mission, missions, progress } = useChallenge();
  const start = useStartChallenge();
  const complete = useCompleteMission();
  const [open, setOpen] = useState<Mission | null>(null);
  const [note, setNote] = useState('');
  const done = new Set((progress.data ?? []).map((p) => p.day));
  const current = state.finished ? null : state.completed + 1;

  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 48 }}>
        <DawnBackdrop
          style={dawnScreen}
          glows={[
            { x: 170, y: -60, width: 260, ...GLOW.pink },
            { x: -110, y: 420, width: 240, ...GLOW.periwinkle },
          ]}
        />
        {/* 사진 머리 */}
        <View className="h-[300px] justify-end gap-[6px] overflow-hidden px-gutter pb-6">
          <Image source={challengeHeroImage} resizeMode="cover" style={StyleSheet.absoluteFill} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, heroOverlay]} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ko.common.back}
            hitSlop={12}
            onPress={() => router.back()}
            className="absolute left-gutter"
            style={{ top: insets.top + 8 }}
          >
            <Icon name="back" size={24} color={tokens.colors['on-photo']} />
          </Pressable>
          <Text className={`${type.label} text-on-photo/85`}>{ko.challenge.eyebrow}</Text>
          <Text accessibilityRole="header" className={`${type.h1} text-on-photo`}>
            {ko.challenge.title}
          </Text>
          <Text className={`${type.caption} text-on-photo/85`}>{ko.challenge.subtitle}</Text>
        </View>

        <View className="px-gutter pt-5">
          <View className="flex-row items-center justify-between">
            <Text className={`${type.bodyMedium} text-plum-deep`}>{ko.challenge.progress}</Text>
            <View className="flex-row items-baseline gap-[2px]">
              <Text className="font-display text-[26px] text-plum">{state.completed}</Text>
              <Text className="font-display text-[18px] text-plum-deep/50">{`/ ${CHALLENGE_DAYS}`}</Text>
            </View>
          </View>
          <View className="mt-[10px] h-[6px] overflow-hidden rounded-[3px] bg-plum-deep/10">
            <View
              className="h-[6px] bg-plum"
              style={{ width: `${(state.completed / CHALLENGE_DAYS) * 100}%` }}
            />
          </View>

          <View className="mt-[18px] flex-row flex-wrap justify-between gap-y-[10px]">
            {Array.from({ length: CHALLENGE_DAYS }, (_, i) => i + 1).map((day) => {
              const isDone = done.has(day);
              const isCurrent = state.started && day === current;
              return (
                <View
                  key={day}
                  accessible
                  accessibilityLabel={`DAY ${day}`}
                  accessibilityState={{ checked: isDone }}
                  className={`h-9 w-9 items-center justify-center rounded-full ${
                    isDone
                      ? 'bg-plum'
                      : isCurrent
                        ? 'border-2 border-plum bg-on-photo/90'
                        : 'bg-on-photo/50'
                  }`}
                  style={
                    isCurrent ? { boxShadow: '0px 0px 10px 0px rgba(113,77,127,0.35)' } : undefined
                  }
                >
                  {isDone ? (
                    <Icon name="check" size={14} color={tokens.colors['on-photo']} />
                  ) : (
                    <Text
                      className={`font-display text-[17px] ${isCurrent ? 'text-plum' : 'text-plum-deep/45'}`}
                    >
                      {day}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          <View className="mt-6 gap-[10px]">
            <SectionLabel
              icon="sparkle"
              label={
                mission
                  ? state.doneToday
                    ? ko.challenge.nextMission(mission.day)
                    : ko.challenge.todayMission(mission.day)
                  : ko.challenge.howTo
              }
            />
            {missions.isPending ? (
              <ActivityIndicator color={tokens.colors.plum} />
            ) : state.finished ? (
              <Text className={`${type.body} text-ink-soft`}>{ko.challenge.finished}</Text>
            ) : (
              mission && (
                <View
                  className="gap-[10px] rounded-[24px] border border-glass-border bg-on-photo/80 p-5"
                  style={shadow.glass}
                >
                  <Text className={`${type.h2} text-plum-deep`}>{mission.title}</Text>
                  <Text className={`${type.caption} text-ink-soft`}>{mission.body}</Text>
                  <View className="flex-row gap-2">
                    {[ko.challenge.minutes, kindLabel(mission.kind)].map((tag) => (
                      <View key={tag} className="rounded-full bg-plum/10 px-[10px] py-[5px]">
                        <Text className={`${type.caption} text-plum`}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  <View className="mt-1">
                    {!state.started ? (
                      <PrimaryButton
                        label={ko.challenge.startChallenge}
                        loading={start.isPending}
                        haptic="medium"
                        onPress={() => start.mutate()}
                      />
                    ) : state.doneToday ? (
                      <Text className={`${type.caption} text-center text-ink-soft`}>
                        {ko.challenge.doneToday}
                      </Text>
                    ) : (
                      <PrimaryButton
                        label={ko.challenge.start}
                        onPress={() => {
                          setNote('');
                          setOpen(mission);
                        }}
                      />
                    )}
                  </View>
                </View>
              )
            )}
          </View>

          <View className="mt-6 gap-[10px]">
            <SectionLabel icon="sparkle" label={ko.challenge.howTo} />
            <View
              className="overflow-hidden rounded-[22px] border border-glass-border bg-glass"
              style={shadow.glass}
            >
              {ko.challenge.steps.map((step, i) => (
                <View
                  key={step}
                  className={`flex-row items-center gap-3 px-[18px] py-[14px] ${
                    i < ko.challenge.steps.length - 1 ? 'border-b border-hairline' : ''
                  }`}
                >
                  <Text className="font-display text-[20px] text-plum">{i + 1}</Text>
                  <Text className={`${type.body} flex-1 text-plum-deep/85`}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {open && (
        <EditSheet
          visible
          title={open.title}
          description={open.body}
          submitLabel={ko.challenge.done}
          canSubmit
          pending={complete.isPending}
          onSubmit={() =>
            complete.mutate(
              { day: open.day, note },
              {
                onSuccess: () => setOpen(null),
              },
            )
          }
          onClose={() => setOpen(null)}
        >
          <SheetInput
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={500}
            placeholder={ko.challenge.notePlaceholder}
            accessibilityLabel={ko.challenge.notePlaceholder}
          />
        </EditSheet>
      )}
    </View>
  );
}
