import { canReadStory } from '@eloria/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStory } from '@/features/story/use-story';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';

/** 전체 스토리 보기(PRD F-06). 안전 검수를 통과한 text_ready 이후에만 본문을 보여 준다. */
export default function StoryText() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const story = useStory(storyId);
  const readable = story.data && canReadStory(story.data.status) && story.data.script;

  return (
    <SafeAreaView className="flex-1 bg-dawn">
      <View className="flex-row justify-end px-gutter py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ko.story.back}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Text className="text-[16px] text-ink-muted">{ko.story.back}</Text>
        </Pressable>
      </View>

      {!readable ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={tokens.colors.plum} />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-6 px-gutter pb-12 pt-4">
          {story.data.title && (
            <Text accessibilityRole="header" className="text-[28px] leading-[38px] text-plum-deep">
              {story.data.title}
            </Text>
          )}
          {story.data.script!.split(/\n\s*\n/).map((paragraph, i) => (
            <Text key={i} className="text-[18px] leading-[30px] text-plum-deep">
              {paragraph.trim()}
            </Text>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
