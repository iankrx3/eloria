import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';

type Props = {
  /** 글자 크기(Figma: 홈 32, 퀴즈 48) */
  size?: number;
  /** light = 밝은 배경(Deep Plum), photo = 사진 위(흰색) */
  tone?: 'light' | 'photo';
  showTagline?: boolean;
};

/** ARIN 워드마크: Cormorant Garamond Medium 대문자, A 안의 네 꼭지 반짝임(Figma Logo / ARIN). */
export function Logo({ size = 32, tone = 'light', showTagline = false }: Props) {
  const color = tone === 'light' ? tokens.colors['plum-deep'] : tokens.colors['on-photo'];
  const sparkle = size * 0.175;

  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={ko.brand.name}
      className="gap-1"
    >
      <View>
        <Text
          className="font-display"
          style={{ fontSize: size, lineHeight: size * 1.21, letterSpacing: size * 0.04, color }}
        >
          {ko.brand.name}
        </Text>
        <Svg
          width={sparkle}
          height={sparkle}
          viewBox="0 0 8.4 8.4"
          style={{ position: 'absolute', left: size * 0.269, top: size * 0.644 }}
        >
          <Path
            d="M4.2 0C4.48 2.45 5.95 3.92 8.4 4.2C5.95 4.48 4.48 5.95 4.2 8.4C3.92 5.95 2.45 4.48 0 4.2C2.45 3.92 3.92 2.45 4.2 0Z"
            fill={color}
          />
        </Svg>
      </View>
      {showTagline && (
        <Text
          className="font-display-semibold text-[10px] tracking-[4px]"
          style={{ color: tone === 'light' ? tokens.colors['ink-soft'] : 'rgba(255,255,255,0.7)' }}
        >
          {ko.brand.tagline}
        </Text>
      )}
    </View>
  );
}
