import { SvgXml } from 'react-native-svg';
import { ICONS, type IconName } from './icon-data';

type Props = {
  name: IconName;
  /** 한 변 길이. 생략하면 Figma 원래 크기 */
  size?: number;
  color?: string;
};

/** Figma에서 가져온 선 아이콘. 색은 currentColor로 칠한다(카카오·애플은 원래 색). */
export function Icon({ name, size, color = '#3E2A4F' }: Props) {
  const icon = ICONS[name];
  const width = size ?? icon.w;
  const height = size ? (size * icon.h) / icon.w : icon.h;
  return (
    <SvgXml
      xml={icon.xml}
      width={width}
      height={height}
      color={color}
      accessible={false}
      pointerEvents="none"
    />
  );
}

export type { IconName };
