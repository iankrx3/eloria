import { router } from 'expo-router';
import { PlaceholderScreen } from '@/components/placeholder-screen';
import { PrimaryButton } from '@/components/primary-button';
import { useAuth } from '@/features/auth/auth-provider';
import { DevStatus } from '@/features/dev/dev-status';
import { useSetOnboardingCompleted } from '@/features/profile/use-profile';
import { ko } from '@/i18n/ko';

/** 마이(PRD 6절). Personal·나의 기록·설정은 M3 이후. 지금은 계정 연결과 개발 상태만 있다. */
export default function Me() {
  const auth = useAuth();
  const setOnboarding = useSetOnboardingCompleted();
  const isAnonymous = auth.status === 'signed-in' && auth.session.user.is_anonymous;

  return (
    <PlaceholderScreen
      title={ko.me.title}
      footer={
        <>
          {isAnonymous && (
            <PrimaryButton label={ko.me.linkAccount} onPress={() => router.push('/link-account')} />
          )}
          {__DEV__ && (
            <PrimaryButton
              variant="ghost"
              label={ko.me.restartOnboarding}
              loading={setOnboarding.isPending}
              onPress={() => setOnboarding.mutate(false, { onSuccess: () => router.replace('/') })}
            />
          )}
        </>
      }
    >
      {__DEV__ && <DevStatus />}
    </PlaceholderScreen>
  );
}
