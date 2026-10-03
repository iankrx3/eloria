import { healthResponseSchema } from '@eloria/shared';
import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { useAuth } from '@/features/auth/auth-provider';
import { useProfile } from '@/features/profile/use-profile';
import { ko } from '@/i18n/ko';
import { api } from '@/lib/api';

/** 개발 빌드에서만 마이 탭에 보이는 세션·API·온보딩 상태 카드. */
export function DevStatus() {
  const auth = useAuth();
  const profile = useProfile();
  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => api('/v1/health', { schema: healthResponseSchema }),
  });

  const sessionLabel =
    auth.status !== 'signed-in'
      ? ko.dev.sessionNone
      : auth.session.user.is_anonymous
        ? ko.dev.sessionAnonymous
        : ko.dev.sessionLinked;

  return (
    <View className="gap-3 rounded-card bg-surface p-4">
      <Text className="text-[13px] text-ink-muted">{ko.dev.title}</Text>
      <Row label={ko.dev.session} value={sessionLabel} />
      {auth.status === 'signed-in' && (
        <Row label={ko.dev.userId} value={auth.session.user.id.slice(0, 8)} />
      )}
      <Row
        label={ko.dev.api}
        value={
          health.isPending ? ko.common.loading : health.isSuccess ? ko.dev.apiOk : ko.dev.apiFail
        }
      />
      <Row
        label={ko.dev.onboarding}
        value={profile.data?.onboardingCompletedAt ? ko.dev.onboardingDone : ko.dev.onboardingTodo}
      />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-[16px] text-plum-deep">{label}</Text>
      <Text className="text-[16px] text-plum">{value}</Text>
    </View>
  );
}
