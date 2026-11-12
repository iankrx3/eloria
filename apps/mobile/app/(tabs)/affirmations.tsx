import { ACTIVITY_RULE } from '@eloria/shared';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DawnBackdrop, GLOW } from '@/components/backgrounds';
import { Icon } from '@/components/icons/icon';
import { MoonSymbol } from '@/components/moon';
import { PrimaryButton } from '@/components/primary-button';
import { useActivity, useRecordActivity } from '@/features/activity/use-activity';
import { AffirmationCard, CARD_HEIGHT } from '@/features/affirmations/affirmation-card';
import { CardStack } from '@/features/affirmations/card-stack';
import { ShareSheet } from '@/features/affirmations/share-sheet';
import {
  useAffirmationProgress,
  useSavedAffirmations,
  useTodayAffirmations,
  useToggleSaveAffirmation,
} from '@/features/affirmations/use-affirmations';
import { useBottomSpace } from '@/features/navigation/tab-bar';
import { useProfile } from '@/features/profile/use-profile';
import { useCurrentVoice } from '@/features/voice/voice-sheet';
import { ko } from '@/i18n/ko';
import { haptic } from '@/lib/haptics';
import { affirmationDoneCard, dawnScreen, shadow } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

const t = ko.affirmations;

/**
 * 확언 탭(Figma A01~A03, PRD F-22). 오늘의 확언 10장을 카드로 넘기고, 저장·공유한다.
 * 10장을 다 넘기면 완료 화면과 함께 그날 활동(확언 10장 = 연속 기록)을 남긴다.
 */
export default function Affirmations() {
  const today = useTodayAffirmations();
  const saved = useSavedAffirmations();
  const toggle = useToggleSaveAffirmation();
  const record = useRecordActivity();
  const activity = useActivity();
  const voice = useCurrentVoice();
  const profile = useProfile();
  const bottom = useBottomSpace();
  const { progress, update } = useAffirmationProgress(today.data?.day);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [sharing, setSharing] = useState<string | null>(null);

  const items = today.data?.items ?? [];
  const savedIds = useMemo(() => new Set(saved.data?.map((s) => s.id)), [saved.data]);
  const index = Math.min(progress?.index ?? 0, Math.max(0, items.length - 1));
  const item = items[index];

  const next = () => {
    haptic('light');
    setNotice(undefined);
    if (index + 1 < items.length) {
      update({ index: index + 1 });
      return;
    }
    // 마지막 카드를 넘겼다: 그날 처음이면 활동을 남긴다(Figma A03 햅틱 = success).
    if (!progress?.done) {
      record.mutate({ affirmations: ACTIVITY_RULE.AFFIRMATIONS_PER_DAY });
    }
    haptic('success');
    update({ done: true, index: 0 });
  };
  const previous = () => {
    if (index === 0) return;
    haptic('light');
    setNotice(undefined);
    update({ index: index - 1 });
  };

  const notifyAt = (profile.data?.affirmationNotifyAt ?? '08:00').slice(0, 5);
  const [h, m] = notifyAt.split(':').map(Number) as [number, number];

  return (
    <View className="flex-1">
      <DawnBackdrop
        style={dawnScreen}
        glows={[
          { x: 170, y: -60, width: 260, ...GLOW.pinkWide },
          { x: -110, y: 420, width: 240, ...GLOW.periwinkle },
          { x: 80, y: 240, width: 200, ...GLOW.cream },
        ]}
      />
      <ScrollView
        scrollEnabled={!dragging}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom, flexGrow: 1 }}
      >
        <SafeAreaView edges={['top']} className="px-gutter pt-2">
          <View className="flex-row items-start justify-between">
            <View className="gap-[6px]">
              <Text accessibilityRole="header" className={`${type.h1} text-plum-deep`}>
                {t.title}
              </Text>
              <Text className={`${type.caption} text-plum/85`}>{t.subtitle}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.savedList}
              onPress={() => {
                haptic('light');
                router.push('/saved-affirmations');
              }}
              className="h-11 w-11 items-center justify-center rounded-full bg-on-photo/70"
            >
              <Icon name="heartFilled" size={22} color={tokens.colors.plum} />
            </Pressable>
          </View>

          {today.isPending || !progress ? (
            <View
              className="mt-[22px] items-center justify-center gap-4 rounded-[30px] border-[1.5px] border-on-photo bg-on-photo/60"
              style={[{ height: CARD_HEIGHT }, shadow.photoCard]}
            >
              <MoonSymbol size={44} pulse />
              <Text className={`${type.caption} text-ink-soft`}>{t.loading}</Text>
            </View>
          ) : today.isError || !item ? (
            <View className="mt-[60px] items-center gap-4">
              <Text className={`${type.body} text-center text-ink-soft`}>{t.failed}</Text>
              <PrimaryButton label={ko.common.retry} onPress={() => today.refetch()} />
            </View>
          ) : progress.done ? (
            <Done
              streak={activity.stats.current}
              time={ko.settings.timeLabel(h, m)}
              onViewSaved={() => router.push('/saved-affirmations')}
              onChangeTime={() => router.push('/settings')}
              onAgain={() => update({ done: false, index: 0 })}
            />
          ) : (
            <>
              <View className="mt-[22px]">
                <CardStack
                  index={index}
                  total={items.length}
                  canPrevious={index > 0}
                  onNext={next}
                  onPrevious={previous}
                  onDragging={setDragging}
                >
                  <AffirmationCard
                    text={item.text}
                    theme={item.theme}
                    saved={savedIds.has(item.id)}
                    onToggleSave={() =>
                      toggle.mutate({ id: item.id, save: !savedIds.has(item.id) })
                    }
                    onShare={() => setSharing(item.text)}
                  />
                </CardStack>
              </View>

              <View className="mt-1 h-11 items-center justify-center">
                {dragging ? (
                  <Text className={`${type.caption} text-plum-deep/55`}>{t.hint}</Text>
                ) : (
                  <View className="flex-row items-center gap-5">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t.previous}
                      accessibilityState={{ disabled: index === 0 }}
                      onPress={previous}
                      className={`h-11 w-11 items-center justify-center rounded-full bg-on-photo/60 ${
                        index === 0 ? 'opacity-50' : ''
                      }`}
                    >
                      <Icon name="undo" size={22} color={tokens.colors['plum-deep']} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t.listen(voice?.name ?? ko.voice.defaultName)}
                      onPress={() => {
                        haptic('light');
                        setNotice(t.listenSoon);
                      }}
                      className="flex-row items-center gap-2 rounded-full bg-plum px-5 py-3"
                      style={shadow.plumButton}
                    >
                      <Icon name="volume" size={20} color={tokens.colors['on-photo']} />
                      <Text className={`${type.caption} text-on-photo`}>
                        {t.listen(voice?.name ?? ko.voice.defaultName)}
                      </Text>
                    </Pressable>
                    <View
                      accessible
                      accessibilityLabel={t.count(index + 1, items.length)}
                      className="h-11 w-11 items-center justify-center rounded-full bg-on-photo/60"
                    >
                      <Text className={`${type.caption} text-plum-deep`}>
                        {t.count(index + 1, items.length)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              {notice && (
                <Text
                  accessibilityLiveRegion="polite"
                  className={`${type.caption} mt-3 text-center text-plum`}
                >
                  {notice}
                </Text>
              )}
            </>
          )}
        </SafeAreaView>
      </ScrollView>

      <ShareSheet text={sharing} onClose={() => setSharing(null)} />
    </View>
  );
}

/** 오늘 10장을 다 읽은 화면(Figma A03) */
function Done({
  streak,
  time,
  onViewSaved,
  onChangeTime,
  onAgain,
}: {
  streak: number;
  time: string;
  onViewSaved: () => void;
  onChangeTime: () => void;
  onAgain: () => void;
}) {
  return (
    <View className="mt-[60px]">
      <View
        className="items-center gap-[14px] rounded-[30px] border-[1.5px] border-on-photo px-7 pb-8 pt-10"
        style={affirmationDoneCard}
      >
        <Icon name="moonSolid" size={44} color={tokens.colors.amber} />
        <Text accessibilityRole="header" className={`${type.h2} text-center text-plum-deep`}>
          {t.doneTitle}
        </Text>
        <Text className={`${type.body} text-center text-plum-deep/65`}>{t.doneBody(time)}</Text>
        {streak > 0 && (
          <View className="flex-row items-center gap-[6px] rounded-full bg-amber/15 px-[14px] py-2">
            <Icon name="flame" size={16} color={tokens.colors.amber} />
            <Text className={`${type.caption} text-plum-deep`}>{t.streak(streak)}</Text>
          </View>
        )}
      </View>
      <View className="mt-[22px] gap-[10px]">
        <PrimaryButton label={t.viewSaved} onPress={onViewSaved} />
        <PrimaryButton variant="ghost" label={t.changeTime} onPress={onChangeTime} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.again}
          onPress={onAgain}
          className="items-center py-2"
        >
          <Text className={`${type.caption} text-plum-deep/55`}>{t.again}</Text>
        </Pressable>
      </View>
    </View>
  );
}
