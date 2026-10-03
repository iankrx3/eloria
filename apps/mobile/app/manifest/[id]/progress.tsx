import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/primary-button';
import { CrisisSupport } from '@/features/safety/crisis-support';
import { Orb } from '@/features/story/orb';
import { progressState } from '@/features/story/progress-state';
import { useStory, useStoryRealtime } from '@/features/story/use-story';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';

/**
 * 생성 진행(DESIGN 4절). 상태는 Realtime으로 받는다(ARCHITECTURE 2.1).
 * 화면을 떠나도 생성은 서버에서 계속된다.
 */
export default function ManifestProgress() {
  const params = useLocalSearchParams<{ id: string; onboarding?: string }>();
  const storyId = params.id;
  const inOnboarding = params.onboarding === '1';
  const story = useStory(storyId);
  const state = story.data ? progressState(story.data.status, story.data.errorCode) : undefined;
  useStoryRealtime(storyId, state?.kind === 'working');

  const openText = () => router.push({ pathname: '/story/[storyId]/text', params: { storyId } });
  const leave = () =>
    inOnboarding
      ? router.replace({ pathname: '/link-account', params: { next: '/paywall' } })
      : router.replace('/');

  if (story.isError) {
    return (
      <SafeAreaView className="flex-1 justify-center gap-4 bg-dawn px-gutter">
        <Text className="text-center text-[16px] text-ink-muted">{ko.progress.failed}</Text>
        <PrimaryButton label={ko.common.retry} onPress={() => story.refetch()} />
      </SafeAreaView>
    );
  }

  if (!state) {
    return (
      <View className="flex-1 items-center justify-center bg-dawn">
        <ActivityIndicator color={tokens.colors.plum} />
      </View>
    );
  }

  if (state.kind === 'crisis') {
    return (
      <SafeAreaView className="flex-1 bg-dawn">
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

  const message =
    state.kind === 'working'
      ? ko.progress[state.message]
      : state.kind === 'done'
        ? ko.progress.ready
        : state.kind === 'blocked'
          ? ko.progress.blocked
          : state.canRead
            ? ko.progress.ttsFailed
            : ko.progress.failed;

  return (
    <SafeAreaView className="flex-1 bg-dawn">
      <View className="flex-1 items-center justify-center gap-8 px-gutter">
        <Orb breathing={state.kind === 'working'} />
        <Text
          accessibilityLiveRegion="polite"
          className="text-center text-[22px] leading-[32px] text-plum-deep"
        >
          {message}
        </Text>
        {story.data?.title && state.kind !== 'blocked' && (
          <Text className="text-center text-[16px] text-ink-muted">{story.data.title}</Text>
        )}
      </View>

      <View className="gap-3 px-gutter pb-6">
        {state.kind === 'working' && state.canReadFirst && (
          <PrimaryButton label={ko.progress.readFirst} onPress={openText} />
        )}
        {state.kind === 'done' && (
          <>
            <PrimaryButton
              label={ko.player.listen}
              onPress={() => router.push({ pathname: '/player/[storyId]', params: { storyId } })}
            />
            <PrimaryButton variant="ghost" label={ko.progress.read} onPress={openText} />
          </>
        )}
        {state.kind === 'failed' && state.canRead && (
          <PrimaryButton label={ko.progress.read} onPress={openText} />
        )}
        {state.kind === 'blocked' || (state.kind === 'failed' && !state.canRead) ? (
          <PrimaryButton
            variant="ghost"
            label={ko.progress.tryAgain}
            onPress={() => router.back()}
          />
        ) : (
          (state.kind === 'done' || !inOnboarding) && (
            <PrimaryButton
              variant="ghost"
              label={inOnboarding ? ko.progress.continue : ko.progress.home}
              onPress={leave}
            />
          )
        )}
      </View>
    </SafeAreaView>
  );
}
