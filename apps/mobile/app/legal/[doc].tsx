import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DawnBackdrop, GLOW } from '@/components/backgrounds';
import { ScreenHeader } from '@/components/screen-header';
import { ko } from '@/i18n/ko';
import { dawnScreen, shadow } from '@/theme/effects';
import { type } from '@/theme/typography';

/**
 * 약관·정책·고객지원 문서(설정 P02). 오픈소스 라이선스는 실제 목록을 보여 주고, 나머지 문서 전문은
 * 출시 전에 채운다(ROADMAP M0 [사람] 개인정보 처리방침·이용약관 초안).
 */
export default function LegalDoc() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const title = ko.legal.titles[doc] ?? ko.settings.legal;
  const isLicenses = doc === 'licenses';

  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <DawnBackdrop style={dawnScreen} glows={[{ x: 170, y: -60, width: 260, ...GLOW.pink }]} />
        <SafeAreaView edges={['top', 'bottom']} className="px-gutter pb-8 pt-2">
          <ScreenHeader title={title} />
          <View
            className="mt-6 gap-3 rounded-[22px] border border-glass-border bg-glass p-5"
            style={shadow.glass}
          >
            {isLicenses ? (
              <>
                <Text className={`${type.body} text-plum-deep`}>{ko.legal.licensesIntro}</Text>
                {ko.legal.fonts.map((f) => (
                  <Text key={f} className={`${type.body} text-plum-deep/85`}>{`· ${f}`}</Text>
                ))}
                <Text className={`${type.body} text-plum-deep/85`}>{`· ${ko.legal.software}`}</Text>
              </>
            ) : (
              <>
                <Text className={`${type.h2} text-plum-deep`}>{ko.legal.pendingTitle}</Text>
                <Text className={`${type.body} text-ink-soft`}>{ko.legal.pendingBody}</Text>
              </>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
