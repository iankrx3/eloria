import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/icons/icon';
import { ko } from '@/i18n/ko';
import { affirmationBackCard, affirmationCard } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

export const CARD_HEIGHT = 420;

/** 카드 위 작은 원형 버튼(저장·공유, 36pt) */
function CardButton({
  icon,
  label,
  onPress,
  selected,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      hitSlop={8}
      onPress={onPress}
      className="h-9 w-9 items-center justify-center rounded-full bg-on-photo/75"
    >
      <Icon name={icon} size={18} color={tokens.colors.plum} />
    </Pressable>
  );
}

/**
 * 확언 카드(Figma A01 "Affirmation Card"): 저장·공유 버튼, 금빛 초승달, 문장(마루 부리 28), 금빛 선, 주제.
 * 긴 문장은 6줄 안에 들어가도록 글자를 줄인다.
 */
export function AffirmationCard({
  text,
  theme,
  saved,
  onToggleSave,
  onShare,
}: {
  text: string;
  theme: string | null;
  saved: boolean;
  onToggleSave: () => void;
  onShare: () => void;
}) {
  return (
    <View
      className="w-full items-center justify-center gap-[18px] overflow-hidden rounded-[30px] border-[1.5px] border-on-photo px-7 pb-10 pt-14"
      style={[{ height: CARD_HEIGHT }, affirmationCard]}
    >
      <View className="absolute left-4 top-4">
        <CardButton
          icon={saved ? 'heartFilled' : 'heart'}
          label={saved ? ko.affirmations.unsave : ko.affirmations.save}
          selected={saved}
          onPress={onToggleSave}
        />
      </View>
      <View className="absolute right-4 top-4">
        <CardButton icon="share" label={ko.affirmations.share} onPress={onShare} />
      </View>

      <Icon name="moonSolid" size={22} color={tokens.colors.amber} />
      <Text
        accessibilityRole="text"
        numberOfLines={6}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        className={`${type.subtitle} text-center text-plum-deep`}
      >
        {text}
      </Text>
      <View className="h-[1.5px] w-6 bg-amber" />
      {theme ? <Text className={`${type.caption} text-plum`}>{theme}</Text> : null}
    </View>
  );
}

/** 맨 앞 카드 뒤로 살짝 보이는 카드 두 장(Figma "Next card") */
export function BackCards({ count, children }: { count: number; children: ReactNode }) {
  return (
    <View style={{ height: CARD_HEIGHT + 30 }}>
      {count >= 2 && (
        <View
          className="absolute bottom-0 left-5 right-5 rounded-[30px] border border-on-photo bg-on-photo/45"
          style={[{ height: CARD_HEIGHT }, affirmationBackCard]}
        />
      )}
      {count >= 1 && (
        <View
          className="absolute left-[10px] right-[10px] top-4 rounded-[30px] border border-on-photo bg-on-photo/70"
          style={[{ height: CARD_HEIGHT }, affirmationBackCard]}
        />
      )}
      {children}
    </View>
  );
}
