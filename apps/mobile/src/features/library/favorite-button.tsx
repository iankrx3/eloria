import { Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ko } from '@/i18n/ko';
import { useFavorites, useToggleFavorite } from './use-library';

// Figma icon/heart(18×18 기준 경로)
const HEART =
  'M14.25 10.5C15.3675 9.405 16.5 8.0925 16.5 6.375C16.5 5.28098 16.0654 4.23177 15.2918 3.45818C14.5182 2.6846 13.469 2.25 12.375 2.25C11.055 2.25 10.125 2.625 9 3.75C7.875 2.625 6.945 2.25 5.625 2.25C4.53098 2.25 3.48177 2.6846 2.70818 3.45818C1.9346 4.23177 1.5 5.28098 1.5 6.375C1.5 8.1 2.625 9.4125 3.75 10.5L9 15.75L14.25 10.5Z';

type Props = {
  storyId: string;
  /** 꺼진 하트 색. 밝은 화면과 사진 위에서 다르게 쓴다. */
  color: string;
  activeColor: string;
  size?: number;
};

/** 좋아요 하트(플레이어, 이야기 카드). 켜지면 속을 채운다. */
export function FavoriteButton({ storyId, color, activeColor, size = 22 }: Props) {
  const favorites = useFavorites();
  const toggle = useToggleFavorite();
  const liked = favorites.data?.has(storyId) ?? false;
  const c = liked ? activeColor : color;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={liked ? ko.favorite.remove : ko.favorite.add}
      accessibilityState={{ selected: liked }}
      hitSlop={10}
      disabled={!favorites.isSuccess}
      onPress={() => toggle.mutate({ storyId, liked: !liked })}
      className="h-12 w-12 items-center justify-center"
    >
      <Svg width={size} height={size} viewBox="0 0 18 18">
        <Path
          d={HEART}
          stroke={c}
          strokeWidth={1.35}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={liked ? c : 'none'}
        />
      </Svg>
    </Pressable>
  );
}
