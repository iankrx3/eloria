import { SymbolView } from 'expo-symbols';
import { Platform, Pressable } from 'react-native';
import { FilledHeart } from '@/components/filled-heart';
import { ko } from '@/i18n/ko';
import { useFavorites, useToggleFavorite } from './use-library';

type Props = {
  storyId: string;
  /** 꺼진 하트 색. 밝은 화면과 플레이어(어두운 배경)에서 다르게 쓴다. */
  color: string;
  activeColor: string;
  size?: number;
};

/** 좋아요 하트(PRD F-06 플레이어, 라이브러리 카드). */
export function FavoriteButton({ storyId, color, activeColor, size = 22 }: Props) {
  const favorites = useFavorites();
  const toggle = useToggleFavorite();
  const liked = favorites.data?.has(storyId) ?? false;

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
      {liked && Platform.OS === 'android' ? (
        // Android 아이콘 글꼴에는 채워진 하트가 없어 직접 그린다.
        <FilledHeart size={size} color={activeColor} />
      ) : (
        <SymbolView
          name={
            liked
              ? { ios: 'heart.fill', android: 'favorite' }
              : { ios: 'heart', android: 'favorite' }
          }
          size={size}
          tintColor={liked ? activeColor : color}
        />
      )}
    </Pressable>
  );
}
