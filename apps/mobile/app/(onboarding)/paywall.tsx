import { router } from 'expo-router';
import { PlaceholderScreen } from '@/components/placeholder-screen';
import { PrimaryButton } from '@/components/primary-button';
import { useSetOnboardingCompleted } from '@/features/profile/use-profile';
import { ko } from '@/i18n/ko';

/** 페이월(PRD F-12). 상품·가격·복원은 M5에서 RevenueCat으로 채운다. 지금은 온보딩을 마치고 홈으로 간다. */
export default function Paywall() {
  const complete = useSetOnboardingCompleted();

  return (
    <PlaceholderScreen
      title={ko.onboarding.paywallTitle}
      body={ko.onboarding.paywallBody}
      footer={
        <PrimaryButton
          label={ko.common.continue}
          loading={complete.isPending}
          onPress={() => complete.mutate(true, { onSuccess: () => router.replace('/(tabs)') })}
        />
      }
    />
  );
}
