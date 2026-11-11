import { GRATITUDE_LINE_MAX, GRATITUDE_LINES, cleanGratitudeLines } from '@eloria/shared';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DawnBackdrop, GLOW } from '@/components/backgrounds';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { SectionLabel } from '@/components/ui';
import { useToday } from '@/features/activity/use-activity';
import { useGratitude, useSaveGratitude } from '@/features/gratitude/use-gratitude';
import { SheetInput } from '@/features/profile/edit-sheet';
import { ko } from '@/i18n/ko';
import { haptic } from '@/lib/haptics';
import { dawnScreenLong, shadow } from '@/theme/effects';
import { type } from '@/theme/typography';

const t = ko.gratitude;
const EMPTY = Array.from({ length: GRATITUDE_LINES }, () => '');

/** 감사 일기(마이 보관함). 하루 세 줄을 적고, 지난 일기를 최근순으로 본다. */
export default function Gratitude() {
  const today = useToday();
  const entries = useGratitude();
  const save = useSaveGratitude();
  const [lines, setLines] = useState<string[]>(EMPTY);
  const [saved, setSaved] = useState(false);

  const todayEntry = entries.data?.find((e) => e.day === today);
  const past = (entries.data ?? []).filter((e) => e.day !== today);

  // 오늘 이미 적었다면 그 내용으로 채운다.
  useEffect(() => {
    if (todayEntry) setLines(EMPTY.map((_, i) => todayEntry.lines[i] ?? ''));
  }, [todayEntry]);

  const canSave = cleanGratitudeLines(lines).length > 0 && !save.isPending;

  return (
    <View className="flex-1">
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <DawnBackdrop
          style={dawnScreenLong}
          glows={[
            { x: 170, y: -60, width: 260, ...GLOW.pinkWide },
            { x: -110, y: 620, width: 260, ...GLOW.periwinkleWide },
          ]}
        />
        <SafeAreaView edges={['top', 'bottom']} className="px-gutter pb-8 pt-2">
          <ScreenHeader title={t.title} />
          <Text className={`${type.caption} mt-[10px] text-ink-soft`}>{t.subtitle}</Text>

          <View
            className="mt-5 gap-3 rounded-[22px] border border-glass-border bg-glass p-5"
            style={shadow.glass}
          >
            <Text className={`${type.label} text-plum`}>{t.today}</Text>
            {lines.map((line, i) => (
              <SheetInput
                key={i}
                value={line}
                maxLength={GRATITUDE_LINE_MAX}
                placeholder={t.placeholder(i + 1)}
                accessibilityLabel={t.placeholder(i + 1)}
                onChangeText={(v) => {
                  setSaved(false);
                  setLines((prev) => prev.map((x, j) => (j === i ? v : x)));
                }}
              />
            ))}
            {save.isError && (
              <Text accessibilityLiveRegion="polite" className={`${type.caption} text-plum`}>
                {t.failed}
              </Text>
            )}
            <PrimaryButton
              label={saved ? t.saved : t.save}
              disabled={!canSave}
              loading={save.isPending}
              haptic="selection"
              onPress={() =>
                save.mutate(lines, {
                  onSuccess: () => {
                    haptic('success');
                    setSaved(true);
                  },
                  onError: () => haptic('error'),
                })
              }
            />
          </View>

          <View className="mt-7 gap-[10px]">
            <SectionLabel icon="sparkle" label={t.past} />
            {past.length === 0 ? (
              <Text className={`${type.caption} pt-2 text-ink-faint`}>{t.empty}</Text>
            ) : (
              past.map((e) => (
                <View
                  key={e.day}
                  className="gap-[6px] rounded-[20px] border border-glass-border bg-glass px-[18px] py-4"
                  style={shadow.glass}
                >
                  <Text className={`${type.caption} text-plum/85`}>{t.dayLabel(e.day)}</Text>
                  {e.lines.map((l, i) => (
                    <Text key={i} className={`${type.body} text-plum-deep`}>{`· ${l}`}</Text>
                  ))}
                </View>
              ))
            )}
          </View>
        </SafeAreaView>
      </KeyboardAwareScrollView>
    </View>
  );
}
