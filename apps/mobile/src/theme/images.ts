import type { ImageHint, LibraryCategory, WishTheme } from '@eloria/shared';
import type { ImageSourcePropType } from 'react-native';
import bedroomImg from '../../assets/images/scenes/bedroom.webp';
import cityNightImg from '../../assets/images/scenes/city-night.webp';
import sunsetRoomImg from '../../assets/images/scenes/sunset-room.webp';
import sunsetWindowImg from '../../assets/images/scenes/sunset-window.webp';
import dinnerImg from '../../assets/images/scenes/dinner.webp';
import skyImg from '../../assets/images/scenes/sky.webp';
import nightWindowImg from '../../assets/images/scenes/night-window.webp';
import lampRoomImg from '../../assets/images/scenes/lamp-room.webp';
import champagneImg from '../../assets/images/scenes/champagne.webp';
import dawnRiverImg from '../../assets/images/scenes/dawn-river.webp';
import moonSymbolImg from '../../assets/images/brand/moon-symbol.png';
import story01Img from '../../assets/images/stories/story-01.webp';
import story02Img from '../../assets/images/stories/story-02.webp';
import story03Img from '../../assets/images/stories/story-03.webp';
import story04Img from '../../assets/images/stories/story-04.webp';
import story05Img from '../../assets/images/stories/story-05.webp';
import story06Img from '../../assets/images/stories/story-06.webp';
import story07Img from '../../assets/images/stories/story-07.webp';
import story08Img from '../../assets/images/stories/story-08.webp';
import story09Img from '../../assets/images/stories/story-09.webp';
import story10Img from '../../assets/images/stories/story-10.webp';
import story11Img from '../../assets/images/stories/story-11.webp';
import story12Img from '../../assets/images/stories/story-12.webp';
import libFeatureImmersionImg from '../../assets/images/library/lib-feature-immersion.webp';
import libCc8ceImg from '../../assets/images/library/lib-cc8ce.webp';
import lib530f0Img from '../../assets/images/library/lib-530f0.webp';
import lib8b1f8Img from '../../assets/images/library/lib-8b1f8.webp';
import lib5dc55Img from '../../assets/images/library/lib-5dc55.webp';
import libDcda7Img from '../../assets/images/library/lib-dcda7.webp';
import lib2ab8bImg from '../../assets/images/library/lib-2ab8b.webp';
import lib63514Img from '../../assets/images/library/lib-63514.webp';
import lib3592cImg from '../../assets/images/library/lib-3592c.webp';
import lib4915aImg from '../../assets/images/library/lib-4915a.webp';
import lib591a1Img from '../../assets/images/library/lib-591a1.webp';
import libE41a5Img from '../../assets/images/library/lib-e41a5.webp';
import libBfbbcImg from '../../assets/images/library/lib-bfbbc.webp';
import lib8ebedImg from '../../assets/images/library/lib-8ebed.webp';
import lib0020aImg from '../../assets/images/library/lib-0020a.webp';
import lib65d9aImg from '../../assets/images/library/lib-65d9a.webp';

/**
 * 앱에 번들한 사진(Figma ARIN에서 내보내 WebP로 변환, D-38).
 * 표지 이미지 생성(M3) 전까지 스토리·리추얼 카드는 이 풀에서 고른다.
 */
export const scenes = {
  bedroom: bedroomImg,
  cityNight: cityNightImg,
  sunsetRoom: sunsetRoomImg,
  sunsetWindow: sunsetWindowImg,
  dinner: dinnerImg,
  sky: skyImg,
  nightWindow: nightWindowImg,
  lampRoom: lampRoomImg,
  champagne: champagneImg,
  dawnRiver: dawnRiverImg,
} satisfies Record<string, ImageSourcePropType>;

export type SceneKey = keyof typeof scenes;

export const moonSymbol: ImageSourcePropType = moonSymbolImg;

/** 이야기 이미지 풀(Figma "Story Image Pool" 12장) */
const STORY_POOL: ImageSourcePropType[] = [
  story01Img,
  story02Img,
  story03Img,
  story04Img,
  story05Img,
  story06Img,
  story07Img,
  story08Img,
  story09Img,
  story10Img,
  story11Img,
  story12Img,
];

const LIBRARY = {
  feature: libFeatureImmersionImg,
  a: libCc8ceImg,
  b: lib8b1f8Img,
  c: lib5dc55Img,
  d: libDcda7Img,
  e: lib2ab8bImg,
  waves: lib63514Img,
  silk: lib3592cImg,
  bowl: lib4915aImg,
  fullMoon: lib591a1Img,
  terrace: libE41a5Img,
  rain: libBfbbcImg,
  song1: lib8ebedImg,
  song2: lib0020aImg,
  song3: lib65d9aImg,
} satisfies Record<string, ImageSourcePropType>;

export const libraryFeatureImage = LIBRARY.feature;
/** 확언 공유 배경(Figma A05 순서) */
export const shareBackgrounds: ImageSourcePropType[] = [
  LIBRARY.c,
  LIBRARY.fullMoon,
  LIBRARY.waves,
  LIBRARY.silk,
];

/** 21일 챌린지 머리 사진(Figma H12 = library 보름달) */
export const challengeHeroImage = LIBRARY.fullMoon;

/** 소원 테마 카드 사진(Figma L01 소원별로 듣기, library/16~21 생성 전 임시 사진) */
export const wishThemeImage: Record<WishTheme, ImageSourcePropType> = {
  exam: LIBRARY.a,
  home: LIBRARY.b,
  job: lib530f0Img,
  love: LIBRARY.c,
  body: LIBRARY.d,
  travel: LIBRARY.e,
};

/** Figma 카드에 정해진 사진(시드 key 기준) */
const LIBRARY_BY_SEED_KEY: Record<string, ImageSourcePropType> = {
  'affirmation-enough': LIBRARY.a,
  'affirmation-loved': LIBRARY.d,
  'affirmation-flow': LIBRARY.c,
  'frequency-528': LIBRARY.waves,
  'frequency-432': LIBRARY.silk,
  'frequency-777': LIBRARY.bowl,
  'meditation-full-moon': LIBRARY.fullMoon,
  'meditation-love-again': LIBRARY.b,
  'meditation-wealth-vessel': LIBRARY.terrace,
  'sleep-rain': LIBRARY.rain,
  'sleep-star-sea': LIBRARY.e,
};

/** 끌어당김 노래 카드(Figma, 노래가 생기기 전 "곧 만나요") */
export const songImages: ImageSourcePropType[] = [LIBRARY.song1, LIBRARY.song2, LIBRARY.song3];

const LIBRARY_BY_CATEGORY: Record<LibraryCategory, ImageSourcePropType[]> = {
  affirmation: [LIBRARY.a, LIBRARY.d, LIBRARY.c],
  frequency: [LIBRARY.waves, LIBRARY.silk, LIBRARY.bowl],
  sleep: [LIBRARY.rain, LIBRARY.e],
  song: [LIBRARY.song1, LIBRARY.song2, LIBRARY.song3],
  money: [LIBRARY.e, LIBRARY.song3, LIBRARY.a],
  love: [LIBRARY.c, LIBRARY.b, LIBRARY.song2],
  career: [LIBRARY.feature, LIBRARY.d, LIBRARY.song1],
  confidence: [LIBRARY.d, LIBRARY.a, LIBRARY.c],
  meditation: [
    LIBRARY.fullMoon,
    LIBRARY.terrace,
    LIBRARY.silk,
    LIBRARY.bowl,
    LIBRARY.waves,
    LIBRARY.rain,
  ],
};

/**
 * 이야기 JSON의 image_hint를 이미 있는 번들 사진에 임시로 붙인다(D-50).
 * dinner만 식탁 장면이고, 나머지는 이야기 풀이다. 새 사진은 만들지 않는다.
 */
const IMAGE_HINT_PHOTO: Record<ImageHint, ImageSourcePropType> = {
  penthouse: story01Img,
  dressroom: story02Img,
  contract: story03Img,
  cafe: story04Img,
  coffee: story05Img,
  dinner: dinnerImg,
  wedding: story06Img,
  paris: story07Img,
  jeju: story08Img,
  yoga: story09Img,
  brunch: story10Img,
  drive: story11Img,
};

/** 같은 id면 항상 같은 그림이 나오도록 문자열 해시로 고른다. */
function hash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function storyCover(storyId: string, imageHint?: string | null): ImageSourcePropType {
  if (imageHint && imageHint in IMAGE_HINT_PHOTO) {
    return IMAGE_HINT_PHOTO[imageHint as ImageHint];
  }
  return STORY_POOL[hash(storyId) % STORY_POOL.length]!;
}

export function libraryCover(category: LibraryCategory, index: number): ImageSourcePropType {
  const list = LIBRARY_BY_CATEGORY[category];
  return list[index % list.length]!;
}

/** 라이브러리 항목 사진: Figma가 정한 사진 → (소원 묶음 확언이면) 테마 사진 → 카테고리 사진 순 */
export function libraryItemImage(
  item: { seedKey: string; category: LibraryCategory; wishTheme: WishTheme | null },
  index: number,
): ImageSourcePropType {
  return (
    LIBRARY_BY_SEED_KEY[item.seedKey] ??
    // 소원 묶음은 확언에 테마 사진, 명상·수면은 카테고리 사진(Figma L06)
    (item.wishTheme && item.category === 'affirmation'
      ? wishThemeImage[item.wishTheme]
      : libraryCover(item.category, index))
  );
}
