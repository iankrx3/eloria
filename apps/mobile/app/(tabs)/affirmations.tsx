import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DawnBackdrop, GLOW } from '@/components/backgrounds';
import { MoonSymbol } from '@/components/moon';
import { ko } from '@/i18n/ko';
import { dawnScreen, shadow } from '@/theme/effects';
import { type } from '@/theme/typography';

/**
 * 확언 탭(Figma 05 Affirmations). 카드 스와이프·저장·공유(PRD F-22)는 확언 생성과 저장 테이블이 생기면
 * 만든다(ROADMAP M7). 그 전까지는 Figma A03 카드 모양으로 준비 중임을 알린다.
 */
export default function Affirmations() {
  return (
    <View className="flex-1">
      <DawnBackdrop
        style={dawnScreen}
        glows={[
          { x: 170, y: -60, width: 260, ...GLOW.pinkWide },
          { x: -110, y: 420, width: 240, ...GLOW.periwinkle },
          { x: 80, y: 240, width: 200, ...GLOW.cream },
        ]}
      />
      <SafeAreaView edges={['top']} className="flex-1 px-gutter pt-2">
        <Text accessibilityRole="header" className={`${type.h1} text-plum-deep`}>
          {ko.affirmations.title}
        </Text>
        <Text className={`${type.caption} mt-[6px] text-ink-soft`}>{ko.affirmations.subtitle}</Text>

        <View
          className="mt-[60px] items-center gap-4 rounded-[28px] border border-glass-border bg-glass px-6 py-10"
          style={shadow.photoCard}
        >
          <MoonSymbol size={44} pulse />
          <Text className={`${type.h2} text-center text-plum-deep`}>
            {ko.affirmations.comingTitle}
          </Text>
          <Text className={`${type.body} text-center text-ink-soft`}>
            {ko.affirmations.comingBody}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
