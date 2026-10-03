import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ManifestInput } from '@/features/manifest/manifest-input';
import { ko } from '@/i18n/ko';

/** 첫 꿈 입력(PRD F-03). 등록하면 생성 진행 화면으로 가고, 그 뒤 계정 연결 → 페이월로 이어진다. */
export default function FirstManifest() {
  return (
    <SafeAreaView className="flex-1 bg-dawn">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 justify-center gap-8 px-gutter">
          <View className="gap-3">
            <Text accessibilityRole="header" className="text-[28px] leading-[38px] text-plum-deep">
              {ko.onboarding.firstManifestTitle}
            </Text>
            <Text className="text-[13px] text-ink-muted">{ko.brand.slogan}</Text>
          </View>
          <ManifestInput
            autoFocus
            onCreated={(storyId) =>
              router.replace({
                pathname: '/manifest/[id]/progress',
                params: { id: storyId, onboarding: '1' },
              })
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
