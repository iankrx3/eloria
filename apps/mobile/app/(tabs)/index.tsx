import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ManifestInput } from '@/features/manifest/manifest-input';
import { ko } from '@/i18n/ko';

/**
 * 홈(DESIGN 4절). 질문과 꿈 입력창이 있다.
 * 오늘의 순간·제안 카드·스트릭 칩은 데일리·라이브러리 작업에서 채운다.
 */
export default function Home() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dawn">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="px-gutter pt-4">
          <Text className="text-[28px] leading-[38px] text-plum-deep">{ko.brand.name}</Text>
          <Text className="text-[10px] tracking-[3px] text-ink-muted">{ko.brand.tagline}</Text>
        </View>
        <View className="flex-1 justify-center gap-8 px-gutter">
          <View className="items-center gap-3">
            <Text className="text-center text-[28px] leading-[38px] text-plum-deep">
              {ko.home.title}
            </Text>
            <Text className="text-[13px] text-ink-muted">{ko.brand.slogan}</Text>
          </View>
          <ManifestInput
            onCreated={(storyId) =>
              router.push({ pathname: '/manifest/[id]/progress', params: { id: storyId } })
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
