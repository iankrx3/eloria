import {
  DESIRED_CHANGES,
  STORY_SCENE_MAX,
  STORY_SCENES_MAX,
  type DesiredChange,
  type StoryScene,
} from '@eloria/shared';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DawnBackdrop, GLOW } from '@/components/backgrounds';
import { Icon } from '@/components/icons/icon';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { ListGroup, ListRow, SectionLabel } from '@/components/ui';
import { ChoiceChips, EditSheet, FieldLabel, SheetInput } from '@/features/profile/edit-sheet';
import { stepOf } from '@/features/onboarding/flow';
import { useProfile, useUpdateSettings } from '@/features/profile/use-profile';
import { ko } from '@/i18n/ko';
import { haptic } from '@/lib/haptics';
import { dawnScreen, shadow } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

const t = ko.goals;

/**
 * 목표 수정(Figma H13): 바라는 변화(여러 개) · 내가 그리는 장면(최대 5개, 이야기 생성 기본 소재) · 퀴즈 다시 하기.
 * 저장하면 다음 이야기·확언부터 반영된다.
 */
export default function Goals() {
  const profile = useProfile();
  const update = useUpdateSettings();
  const [changes, setChanges] = useState<DesiredChange[]>([]);
  const [scenes, setScenes] = useState<StoryScene[]>([]);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState('');
  const [tag, setTag] = useState<DesiredChange | undefined>();

  useEffect(() => {
    if (!profile.data) return;
    setChanges((profile.data.desiredChanges ?? []) as DesiredChange[]);
    setScenes(profile.data.storyScenes ?? []);
  }, [profile.data]);

  const toggle = (c: DesiredChange) => {
    haptic('selection');
    setChanges((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const openScene = (i: number | 'new') => {
    const s = i === 'new' ? undefined : scenes[i];
    setDraft(s?.text ?? '');
    setTag(s?.tag ?? undefined);
    setEditing(i);
  };

  const saveScene = () => {
    const scene: StoryScene = { text: draft.trim(), tag: tag ?? null };
    setScenes((prev) =>
      editing === 'new' ? [...prev, scene] : prev.map((s, i) => (i === editing ? scene : s)),
    );
    setEditing(null);
  };

  const deleteScene = () => {
    haptic('warning');
    setScenes((prev) => prev.filter((_, i) => i !== editing));
    setEditing(null);
  };

  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <DawnBackdrop
          style={dawnScreen}
          glows={[
            { x: 170, y: -60, width: 260, ...GLOW.pink },
            { x: -110, y: 420, width: 240, ...GLOW.periwinkle },
          ]}
        />
        <SafeAreaView edges={['top', 'bottom']} className="px-gutter pb-10 pt-2">
          <ScreenHeader title={t.title} />
          <Text className={`${type.caption} mt-2 text-ink-soft`}>{t.subtitle}</Text>

          <View className="mt-6 gap-[10px]">
            <SectionLabel icon="sparkle" label={t.changes} />
            <View className="flex-row flex-wrap gap-2">
              {DESIRED_CHANGES.map((c) => {
                const on = changes.includes(c);
                return (
                  <Pressable
                    key={c}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={t.changeOptions[c]}
                    onPress={() => toggle(c)}
                    className={`flex-row items-center gap-[6px] rounded-full px-4 py-[10px] ${
                      on ? 'bg-plum' : 'border border-glass-border bg-glass'
                    }`}
                    style={on ? undefined : shadow.glass}
                  >
                    {on && <Icon name="checkSmall" size={12} color={tokens.colors['on-photo']} />}
                    <Text className={`${type.body} ${on ? 'text-on-photo' : 'text-plum-deep'}`}>
                      {t.changeOptions[c]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mt-7 gap-[10px]">
            <SectionLabel icon="sparkle" label={t.scenes} />
            {scenes.map((s, i) => (
              <Pressable
                key={`${s.text}-${i}`}
                accessibilityRole="button"
                accessibilityLabel={t.editScene(s.text)}
                onPress={() => {
                  haptic('light');
                  openScene(i);
                }}
                className="flex-row items-center gap-3 rounded-[22px] border border-glass-border bg-on-photo/70 px-[18px] py-4"
                style={shadow.glass}
              >
                <View className="flex-1 items-start gap-[6px]">
                  <Text className={`${type.bodyMedium} text-plum-deep`}>{s.text}</Text>
                  {s.tag && (
                    <View className="rounded-full bg-plum/10 px-[10px] py-1">
                      <Text className={`${type.caption} text-plum`}>{t.changeOptions[s.tag]}</Text>
                    </View>
                  )}
                </View>
                <Icon name="edit" size={16} color={tokens.colors['ink-soft']} />
              </Pressable>
            ))}
            {scenes.length < STORY_SCENES_MAX && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.addScene}
                onPress={() => {
                  haptic('light');
                  openScene('new');
                }}
                className="flex-row items-center justify-center gap-[6px] rounded-[22px] border-[1.2px] border-dashed border-plum/50 py-4"
              >
                <Icon name="plus" size={16} color={tokens.colors.plum} />
                <Text className={`${type.bodyMedium} text-plum`}>{t.addScene}</Text>
              </Pressable>
            )}
          </View>

          <View className="mt-7 gap-[10px]">
            <SectionLabel icon="sparkle" label={t.retake} />
            <ListGroup>
              <ListRow
                label={t.retakeTitle}
                sub={t.retakeHint}
                last
                // Figma H13: 퀴즈 Q04(요즘 가장 이루고 싶은 것)부터 다시
                onPress={() => router.push(`/quiz/${stepOf('desire')}`)}
              />
            </ListGroup>
          </View>

          <View className="mt-8">
            <PrimaryButton
              label={t.save}
              loading={update.isPending}
              haptic={null}
              onPress={() =>
                update.mutate(
                  { desiredChanges: changes, storyScenes: scenes },
                  {
                    onSuccess: () => {
                      haptic('success');
                      router.back();
                    },
                  },
                )
              }
            />
          </View>
        </SafeAreaView>
      </ScrollView>

      {editing !== null && (
        <EditSheet
          visible
          title={t.sceneSheetTitle}
          description={t.sceneSheetDesc}
          submitLabel={ko.me.sheet.save}
          canSubmit={draft.trim().length > 0}
          onSubmit={saveScene}
          onClose={() => setEditing(null)}
        >
          <SheetInput
            value={draft}
            onChangeText={setDraft}
            autoFocus
            maxLength={STORY_SCENE_MAX}
            placeholder={t.scenePlaceholder}
            accessibilityLabel={t.sceneSheetTitle}
          />
          <FieldLabel>{t.sceneTag}</FieldLabel>
          <ChoiceChips
            options={DESIRED_CHANGES.map((c) => ({ key: c, label: t.changeOptions[c] }))}
            value={tag}
            onChange={setTag}
          />
          {editing !== 'new' && (
            <PrimaryButton
              variant="ghost"
              label={t.deleteScene}
              haptic={null}
              onPress={deleteScene}
            />
          )}
        </EditSheet>
      )}
    </View>
  );
}
