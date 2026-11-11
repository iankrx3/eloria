import { Linking, Pressable, Text, View } from 'react-native';
import { ko } from '@/i18n/ko';

const LINES = [
  { name: ko.safety.supportSuicideLine, detail: ko.safety.supportSuicideLineDetail, tel: '109' },
  { name: ko.safety.supportMentalLine, detail: ko.safety.supportMentalLineDetail, tel: '15770199' },
] as const;

/** 꿈 입력에 위기 신호가 있으면 스토리 대신 도움받을 곳을 안내한다(AI_PIPELINE 4.3). */
export function CrisisSupport() {
  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text
          accessibilityRole="header"
          className="font-serif-semibold text-[30px] leading-[42px] tracking-[-0.3px] text-plum-deep"
        >
          {ko.safety.supportTitle}
        </Text>
        <Text className="font-sans text-[16px] leading-[24px] tracking-[-0.16px] text-ink-soft">
          {ko.safety.supportBody}
        </Text>
      </View>
      {LINES.map((line) => (
        <Pressable
          key={line.tel}
          accessibilityRole="link"
          accessibilityLabel={ko.safety.call(line.name)}
          onPress={() => Linking.openURL(`tel:${line.tel}`)}
          className="gap-1 rounded-[22px] border border-glass-border bg-glass p-[18px]"
        >
          <Text className="font-sans text-[16px] leading-[24px] text-plum-deep">{line.name}</Text>
          <Text className="font-sans text-[12px] leading-[17px] text-ink-soft">{line.detail}</Text>
        </Pressable>
      ))}
    </View>
  );
}
