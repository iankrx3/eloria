import type { LibraryCategory } from '@eloria/shared';
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
/** 21일 챌린지 머리 사진(Figma H12 = library 보름달) */
export const challengeHeroImage = LIBRARY.fullMoon;

const LIBRARY_BY_CATEGORY: Record<LibraryCategory, ImageSourcePropType[]> = {
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

/** 같은 id면 항상 같은 그림이 나오도록 문자열 해시로 고른다. */
function hash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function storyCover(storyId: string): ImageSourcePropType {
  return STORY_POOL[hash(storyId) % STORY_POOL.length]!;
}

export function libraryCover(category: LibraryCategory, index: number): ImageSourcePropType {
  const list = LIBRARY_BY_CATEGORY[category];
  return list[index % list.length]!;
}
