import { router } from 'expo-router';
import { PlaceholderScreen } from '@/components/placeholder-screen';
import { PrimaryButton } from '@/components/primary-button';
import { ko } from '@/i18n/ko';

/** 첫 꿈 입력(PRD F-03). 입력·생성 진행·첫 스토리는 M2에서 이 화면 뒤에 붙는다. */
export default function FirstManifest() {
  return (
    <PlaceholderScreen
      title={ko.onboarding.firstManifestTitle}
      body={ko.onboarding.firstManifestBody}
      footer={
        <PrimaryButton
          label={ko.common.next}
          onPress={() => router.push({ pathname: '/link-account', params: { next: '/paywall' } })}
        />
      }
    />
  );
}
