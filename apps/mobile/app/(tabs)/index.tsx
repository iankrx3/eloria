import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ko } from '@/i18n/ko';

/**
 * 홈(DESIGN 4절). 지금은 브랜드 영역과 질문만 있다.
 * 꿈 입력창·오늘의 순간·제안 카드는 M2 "홈 꿈 입력" 작업에서 채운다.
 */
export default function Home() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dawn">
      <View className="px-gutter pt-4">
        <Text className="text-[28px] leading-[38px] text-plum-deep">{ko.brand.name}</Text>
        <Text className="text-[10px] tracking-[3px] text-ink-muted">{ko.brand.tagline}</Text>
      </View>
      <View className="flex-1 items-center justify-center gap-3 px-gutter">
        <Text className="text-center text-[28px] leading-[38px] text-plum-deep">
          {ko.home.title}
        </Text>
        <Text className="text-[13px] text-ink-muted">{ko.brand.slogan}</Text>
      </View>
    </SafeAreaView>
  );
}
