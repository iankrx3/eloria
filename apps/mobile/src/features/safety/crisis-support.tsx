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
        <Text accessibilityRole="header" className="text-[28px] leading-[38px] text-plum-deep">
          {ko.safety.supportTitle}
        </Text>
        <Text className="text-[16px] leading-[24px] text-ink-muted">{ko.safety.supportBody}</Text>
      </View>
      {LINES.map((line) => (
        <Pressable
          key={line.tel}
          accessibilityRole="link"
          accessibilityLabel={ko.safety.call(line.name)}
          onPress={() => Linking.openURL(`tel:${line.tel}`)}
          className="gap-1 rounded-card bg-surface p-4"
        >
          <Text className="text-[16px] text-plum-deep">{line.name}</Text>
          <Text className="text-[13px] text-ink-muted">{line.detail}</Text>
        </Pressable>
      ))}
    </View>
  );
}
