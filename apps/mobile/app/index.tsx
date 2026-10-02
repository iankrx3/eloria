import { healthResponseSchema } from '@eloria/shared';
import { useQuery } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/auth-provider';
import { ko } from '@/i18n/ko';
import { api } from '@/lib/api';

/**
 * M1 확인용 첫 화면: 익명 세션과 API 연결 상태를 보여 준다.
 * 퀴즈·홈 화면이 생기면(M2) 온보딩 진입점으로 바뀐다.
 */
export default function Index() {
  const auth = useAuth();
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
    <SafeAreaView className="flex-1 bg-dawn">
      <View className="flex-1 justify-center gap-6 px-gutter">
        <View className="items-center gap-1">
          <Text className="text-[28px] leading-[38px] text-plum-deep">{ko.brand.name}</Text>
          <Text className="text-[10px] tracking-[3px] text-ink-muted">{ko.brand.tagline}</Text>
        </View>

        <View className="gap-3 rounded-card bg-surface p-4">
          <Text className="text-[13px] text-ink-muted">{ko.dev.title}</Text>
          <Row label={ko.dev.session} value={sessionLabel} />
          {auth.status === 'signed-in' && (
            <Row label={ko.dev.userId} value={auth.session.user.id.slice(0, 8)} />
          )}
          <Row
            label={ko.dev.api}
            value={
              health.isPending
                ? ko.common.loading
                : health.isSuccess
                  ? ko.dev.apiOk
                  : ko.dev.apiFail
            }
          />
        </View>

        {health.isError && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ko.common.retry}
            onPress={() => health.refetch()}
            className="items-center rounded-full bg-plum py-3"
          >
            <Text className="text-[16px] text-on-dusk">{ko.common.retry}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
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
