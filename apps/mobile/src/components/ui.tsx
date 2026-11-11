import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GlassFill } from '@/components/glass';
import { Icon, type IconName } from '@/components/icons/icon';
import { ko } from '@/i18n/ko';
import { shadow } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';
import { haptic } from '@/lib/haptics';

/** 원형 아이콘 버튼. photo = 사진 위 유리(흰 16%), light = 밝은 화면 유리(흰 62%) */
export function RoundButton({
  icon,
  label,
  onPress,
  tone = 'light',
  size = 40,
  iconSize = 18,
  active = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  tone?: 'light' | 'photo';
  size?: number;
  iconSize?: number;
  active?: boolean;
}) {
  const photo = tone === 'photo';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={() => {
        haptic('light');
        onPress();
      }}
      hitSlop={6}
      className={`items-center justify-center overflow-hidden rounded-full border ${
        photo ? (active ? 'border-on-photo' : 'border-on-photo/40') : 'border-glass-border bg-glass'
      }`}
      style={[{ width: size, height: size }, photo ? undefined : shadow.glass]}
    >
      {photo && (
        <GlassFill blur={10} fill={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.16)'} />
      )}
      <Icon
        name={icon}
        size={iconSize}
        color={photo ? tokens.colors['on-photo'] : tokens.colors['plum-deep']}
      />
    </Pressable>
  );
}

/** 필터 칩(라이브러리 상단). 고른 칩은 plum, 나머지는 유리 */
export function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={() => {
        haptic('light');
        onPress();
      }}
      className={`rounded-full px-[14px] py-[7px] ${
        selected ? 'bg-plum' : 'border border-glass-border bg-glass'
      }`}
    >
      <Text className={`${type.caption} ${selected ? 'text-on-photo' : 'text-plum-deep'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

/** 사진 위 유리 알약(전체 이야기 보기, 공유하기) */
export function GlassPill({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptic('light');
        onPress();
      }}
      className="flex-row items-center gap-2 self-start overflow-hidden rounded-full border border-on-photo/45 py-[10px] pl-4 pr-[18px]"
    >
      <GlassFill blur={10} fill="rgba(255,255,255,0.16)" />
      {icon && <Icon name={icon} size={18} color={tokens.colors['on-photo']} />}
      <Text className={`${type.caption} text-on-photo`}>{label}</Text>
    </Pressable>
  );
}

/** 섹션 제목 + "전체 보기 >"(라이브러리·홈) */
export function SectionHeader({
  title,
  onSeeAll,
  action,
}: {
  title: string;
  onSeeAll?: () => void;
  action?: ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text accessibilityRole="header" className={`${type.h2} text-plum-deep`}>
        {title}
      </Text>
      {action ??
        (onSeeAll && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${title} ${ko.common.seeAll}`}
            onPress={() => {
              haptic('light');
              onSeeAll();
            }}
            hitSlop={8}
            className="flex-row items-center gap-[2px]"
          >
            <Text className={`${type.caption} text-ink-soft`}>{ko.common.seeAll}</Text>
            <Icon name="chevronSmall" size={14} color={tokens.colors['ink-soft']} />
          </Pressable>
        ))}
    </View>
  );
}

/** 마이페이지 섹션 이름(작은 아이콘 + 12px plum) */
export function SectionLabel({
  icon,
  label,
  right,
}: {
  icon: IconName;
  label: string;
  right?: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-[6px]">
      <Icon name={icon} size={12} color={tokens.colors.plum} />
      <Text accessibilityRole="header" className={`${type.caption} flex-1 text-plum/85`}>
        {label}
      </Text>
      {right}
    </View>
  );
}

/** 유리 그룹 카드(마이페이지 목록). 안의 행 사이에 가는 선을 긋는다. */
export function ListGroup({ children }: { children: ReactNode }) {
  return (
    <View
      className="overflow-hidden rounded-[22px] border border-glass-border bg-glass"
      style={shadow.glass}
    >
      {children}
    </View>
  );
}

/** 그룹 안의 한 줄: 이름 · (값) · > */
export function ListRow({
  label,
  value,
  sub,
  onPress,
  last = false,
  chevron = true,
  right,
  destructive = false,
}: {
  label: string;
  value?: string;
  sub?: string;
  onPress?: () => void;
  last?: boolean;
  chevron?: boolean;
  right?: ReactNode;
  destructive?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={value ? `${label} ${value}` : label}
      disabled={!onPress}
      onPress={
        onPress &&
        (() => {
          haptic('light');
          onPress();
        })
      }
      className={`flex-row items-center gap-2 px-[18px] py-4 ${last ? '' : 'border-b border-hairline'}`}
    >
      <View className="flex-1 gap-[2px]">
        <Text className={`${type.body} ${destructive ? 'text-plum' : 'text-plum-deep/85'}`}>
          {label}
        </Text>
        {sub && <Text className={`${type.caption} text-ink-faint`}>{sub}</Text>}
      </View>
      {value !== undefined && (
        <Text numberOfLines={1} className={`${type.bodyMedium} max-w-[60%] text-plum-deep`}>
          {value}
        </Text>
      )}
      {right}
      {chevron && onPress && (
        <Icon name="chevronRow" size={16} color={tokens.colors['ink-faint']} />
      )}
    </Pressable>
  );
}

/** 지울 수 있는 칩(라이프스타일, 이야기에서 빼줘) */
export function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <View
      className="flex-row items-center gap-[6px] rounded-full border border-glass-border bg-glass py-[10px] pl-4 pr-3"
      style={shadow.glass}
    >
      <Text className={`${type.body} text-plum-deep`}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ko.me.remove(label)}
        hitSlop={10}
        onPress={() => {
          haptic('light');
          onRemove();
        }}
      >
        <Icon name="removeSmall" size={12} color={tokens.colors['ink-soft']} />
      </Pressable>
    </View>
  );
}

/** 점선 "+ 추가" 칩 */
export function AddChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptic('light');
        onPress();
      }}
      className="flex-row items-center gap-1 rounded-full border-[1.2px] border-dashed border-plum/50 px-4 py-[10px]"
    >
      <Icon name="plusSmall" size={14} color={tokens.colors.plum} />
      <Text className={`${type.body} text-plum`}>{label}</Text>
    </Pressable>
  );
}

/** 그룹 맨 아래 "+ 사람 추가" 줄 */
export function AddRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptic('light');
        onPress();
      }}
      className="flex-row items-center justify-center gap-[6px] py-[14px]"
    >
      <Icon name="plus" size={16} color={tokens.colors.plum} />
      <Text className={`${type.bodyMedium} text-plum`}>{label}</Text>
    </Pressable>
  );
}
