import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from '@/audio/player-store';
import { Icon, type IconName } from '@/components/icons/icon';
import { MiniPlayer } from '@/features/player/mini-player';
import { ko } from '@/i18n/ko';
import { shadow } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

type TabKey = keyof typeof ko.tabs;

const TABS: Record<string, { key: TabKey; icon: IconName }> = {
  index: { key: 'home', icon: 'home' },
  library: { key: 'library', icon: 'library' },
  affirmations: { key: 'affirmations', icon: 'star' },
  me: { key: 'me', icon: 'user' },
};

const TAB_BAR_HEIGHT = 71;
const MINI_PLAYER_HEIGHT = 60;
const GAP = 9;
const BOTTOM_MARGIN = 12;

/** 화면 아래 내용이 떠 있는 탭 바·미니 플레이어에 가리지 않도록 줄 여백 */
export function useBottomSpace() {
  const insets = useSafeAreaInsets();
  const playing = usePlayerStore((s) => Boolean(s.track));
  return (
    insets.bottom + BOTTOM_MARGIN + TAB_BAR_HEIGHT + (playing ? MINI_PLAYER_HEIGHT + GAP : 0) + 24
  );
}

/**
 * 떠 있는 알약 탭 바(Figma Tab Bar: 홈 · 라이브러리 · 확언 · 마이페이지).
 * JS 탭 바를 쓰는 이유는 미니 플레이어를 iOS·Android 모두 탭 위에 고정하기 위해서다(D-24).
 * 화면 내용이 탭 바 뒤로 지나가도록 절대 위치로 띄운다.
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-4 gap-[9px]"
      style={{ bottom: insets.bottom + BOTTOM_MARGIN }}
    >
      <MiniPlayer />
      <View
        className="flex-row items-center justify-between rounded-[28px] border border-on-photo bg-pearl px-8 py-3"
        style={shadow.tabBar}
      >
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = state.index === index;
          const label = ko.tabs[tab.key];
          const color = focused ? tokens.colors.plum : tokens.colors['plum-deep'];

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              hitSlop={8}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              className={`items-center gap-1 ${focused ? '' : 'opacity-50'}`}
            >
              <Icon name={tab.icon} size={24} color={color} />
              <Text className={type.caption} style={{ color }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
