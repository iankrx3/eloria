import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';

type TabKey = keyof typeof ko.tabs;

const TABS: Record<string, { key: TabKey; icon: SymbolViewProps['name'] }> = {
  index: { key: 'home', icon: { ios: 'house.fill', android: 'home' } },
  library: { key: 'library', icon: { ios: 'books.vertical.fill', android: 'library_books' } },
  rituals: { key: 'rituals', icon: { ios: 'sparkles', android: 'auto_awesome' } },
  me: { key: 'me', icon: { ios: 'person.fill', android: 'person' } },
};

/**
 * 하단 탭 바(DESIGN 4절: 홈·라이브러리·리추얼·마이).
 * JS 탭 바를 쓰는 이유는 미니 플레이어를 iOS·Android 모두 탭 위에 고정하기 위해서다(D-24).
 * 미니 플레이어는 M2 플레이어 작업에서 이 컴포넌트 위쪽에 붙인다.
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row border-t border-dawn-2 bg-dawn px-2 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const label = ko.tabs[tab.key];
        const color = focused ? tokens.colors.plum : tokens.colors['ink-muted'];

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            className="flex-1 items-center gap-1 py-1"
          >
            <SymbolView name={tab.icon} size={24} tintColor={color} />
            <Text className={`text-[11px] ${focused ? 'text-plum' : 'text-ink-muted'}`}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
