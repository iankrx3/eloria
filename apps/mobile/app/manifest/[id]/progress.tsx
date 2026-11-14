import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhotoBackground } from '@/components/backgrounds';
import { GlassFill } from '@/components/glass';
import { Icon, type IconName } from '@/components/icons/icon';
import { PrimaryButton } from '@/components/primary-button';
import { RoundButton } from '@/components/ui';
import { useProfile } from '@/features/profile/use-profile';
import { CrisisSupport } from '@/features/safety/crisis-support';
import { progressState, type ProgressMessage } from '@/features/story/progress-state';
import { useStory, useStoryRealtime } from '@/features/story/use-story';
import { ko } from '@/i18n/ko';
import { haptic } from '@/lib/haptics';
import { photoText, photoTextSoft, progressOverlay } from '@/theme/effects';
import { scenes, storyCover } from '@/theme/images';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

type StepState = 'done' | 'active' | 'todo';

/** 서버 상태 → 화면 3단계(장면 고르기 · 이야기 쓰기 · 목소리 입히기) */
function stepStates(message: ProgressMessage): [StepState, StepState, StepState] {
  switch (message) {
    case 'queued':
    case 'planning':
      return ['active', 'todo', 'todo'];
    case 'writing':
    case 'reviewing':
      return ['done', 'active', 'todo'];
    case 'voicing':
      return ['done', 'done', 'active'];
  }
}

const STEP_ICON: Record<StepState, IconName> = { done: 'check', active: 'progress', todo: 'todo' };

/**
 * 생성 진행(Figma H04 이야기 짓는 중 → H06 이야기 준비). 상태는 Realtime으로 받는다(ARCHITECTURE 2.1).
 * 화면을 떠나도 생성은 서버에서 계속된다.
 */
export default function ManifestProgress() {
  const { id: storyId } = useLocalSearchParams<{ id: string }>();
  const story = useStory(storyId);
  const name = useProfile().data?.displayName ?? null;
  const state = story.data ? progressState(story.data.status, story.data.errorCode) : undefined;
  useStoryRealtime(storyId, state?.kind === 'working');
  // 완성되는 순간 success(Figma H04 노트)
  const done = state?.kind === 'done';
  useEffect(() => {
    if (done) haptic('success');
  }, [done]);

  const openText = () => router.push({ pathname: '/story/[storyId]/text', params: { storyId } });
  const home = () => router.replace('/');

  if (story.isError) {
    return (
      <PhotoBackground source={scenes.sky} overlay={progressOverlay}>
        <SafeAreaView className="flex-1 justify-center gap-4 px-gutter">
          <Text className={`${type.body} text-center text-on-photo`} style={photoTextSoft}>
            {ko.progress.failed}
          </Text>
          <PrimaryButton variant="pearl" label={ko.common.retry} onPress={() => story.refetch()} />
        </SafeAreaView>
      </PhotoBackground>
    );
  }

  if (!state) {
    return (
      <View className="flex-1 items-center justify-center bg-twilight">
        <ActivityIndicator color={tokens.colors['on-photo']} />
      </View>
    );
  }

  if (state.kind === 'crisis') {
    return (
      <SafeAreaView className="flex-1 bg-pearl">
        <ScrollView contentContainerClassName="gap-6 px-gutter py-8">
          <CrisisSupport />
          <PrimaryButton
            variant="ghost"
            label={ko.progress.tryAgain}
            onPress={() => router.back()}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 완성(H06): 이야기 사진 위에 제목, 들어보기
  if (state.kind === 'done') {
    return (
      <PhotoBackground source={storyCover(storyId, story.data?.imageHint)} overlay={progressOverlay}>
        <SafeAreaView className="flex-1 px-gutter pb-9 pt-2">
          <View className="items-end">
            <RoundButton icon="close" label={ko.progress.home} tone="photo" onPress={home} />
          </View>
          <Text
            accessibilityRole="header"
            className={`${type.subtitle} mt-12 text-on-photo`}
            style={photoText}
          >
            {story.data?.title ?? ko.progress.ready}
          </Text>
          <View className="flex-1" />
          <Text className={`${type.labelSmall} text-on-photo/80`}>{ko.progress.readyEyebrow}</Text>
          <Text className={`${type.body} mt-2 text-on-photo/90`}>{ko.progress.ready}</Text>
          <View className="mt-6 gap-3">
            <PrimaryButton
              variant="pearl"
              label={ko.player.listen}
              onPress={() => router.replace({ pathname: '/player/[storyId]', params: { storyId } })}
            />
            <PrimaryButton variant="ghost-photo" label={ko.progress.read} onPress={openText} />
          </View>
        </SafeAreaView>
      </PhotoBackground>
    );
  }

  const failedMessage =
    state.kind === 'blocked'
      ? ko.progress.blocked
      : state.kind === 'failed'
        ? state.canRead
          ? ko.progress.ttsFailed
          : ko.progress.failed
        : undefined;

  return (
    <PhotoBackground source={scenes.sky} overlay={progressOverlay}>
      <SafeAreaView className="flex-1 px-gutter pb-6 pt-2">
        <View className="flex-row">
          <RoundButton icon="back" label={ko.progress.home} tone="photo" onPress={home} />
        </View>

        <View className="flex-1 items-center justify-center gap-3">
          <Text className={`${type.labelSmall} text-on-photo/85`} style={photoTextSoft}>
            {ko.progress.eyebrow}
          </Text>
          <Text
            accessibilityLiveRegion="polite"
            className={`${type.h1} text-center text-on-photo`}
            style={photoText}
          >
            {failedMessage ? ko.progress.failed : ko.progress.title}
          </Text>
          <Text className={`${type.body} text-center text-on-photo/90`} style={photoTextSoft}>
            {failedMessage ?? ko.progress.subtitle(name)}
          </Text>

          {state.kind === 'working' && (
            <View className="mt-6 gap-3 overflow-hidden rounded-[20px] border border-on-photo/40 px-[22px] py-[18px]">
              <GlassFill blur={12} fill="rgba(255,255,255,0.16)" />
              {stepStates(state.message).map((s, i) => {
                const label = [
                  ko.progress.steps.plan,
                  ko.progress.steps.write,
                  ko.progress.steps.voice,
                ][i]!;
                return (
                  <View key={label} className="flex-row items-center gap-[10px]">
                    <Icon
                      name={STEP_ICON[s]}
                      size={16}
                      color={s === 'todo' ? 'rgba(255,255,255,0.55)' : tokens.colors['on-photo']}
                    />
                    <Text
                      className={`${type.body} ${s === 'todo' ? 'text-on-photo/55' : 'text-on-photo'}`}
                    >
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View className="gap-3">
          {state.kind === 'working' && state.canReadFirst && (
            <PrimaryButton variant="pearl" label={ko.progress.readFirst} onPress={openText} />
          )}
          {state.kind === 'failed' && state.canRead && (
            <PrimaryButton variant="pearl" label={ko.progress.read} onPress={openText} />
          )}
          {(state.kind === 'blocked' || (state.kind === 'failed' && !state.canRead)) && (
            <PrimaryButton
              variant="pearl"
              label={ko.progress.tryAgain}
              onPress={() => router.back()}
            />
          )}
        </View>
      </SafeAreaView>
    </PhotoBackground>
  );
}
