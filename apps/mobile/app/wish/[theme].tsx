import { WISH_BUNDLE_ORDER, WISH_THEMES, type WishTheme } from '@eloria/shared';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DawnBackdrop, GLOW } from '@/components/backgrounds';
import { ScreenHeader } from '@/components/screen-header';
import { groupWishBundles } from '@/features/rituals/group-rituals';
import { openItem, playBundle, TrackRow } from '@/features/rituals/track-cards';
import { useRituals } from '@/features/rituals/use-rituals';
import { ko } from '@/i18n/ko';
import { dawnScreen, wishHeroShadow } from '@/theme/effects';
import { wishThemeImage } from '@/theme/images';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

const t = ko.library;

/**
 * 소원 테마 묶음(Figma L06). 대표 사진, "묶음 전체 이어 듣기"(확언 → 명상 → 수면 자동 재생),
 * 확언 / 명상 / 수면 목록. 행 탭 = 그 콘텐츠부터 묶음 끝까지 이어 듣기.
 */
export default function WishBundleScreen() {
  const params = useLocalSearchParams<{ theme: string }>();
  const theme = WISH_THEMES.find((w) => w === params.theme) as WishTheme | undefined;
  const rituals = useRituals();
  const insets = useSafeAreaInsets();
  const bundle = useMemo(
    () => groupWishBundles(rituals.data ?? []).find((b) => b.theme === theme),
    [rituals.data, theme],
  );
  const copy = theme ? t.wishThemes[theme] : undefined;

  const groups = WISH_BUNDLE_ORDER.map((category) => ({
    category,
    data: bundle?.data.filter((i) => i.category === category) ?? [],
  })).filter((g) => g.data.length > 0);
  const summary = bundle
    ? t.wishSummary(
        groups.map((g) => t.wishPart(t.categories[g.category], g.data.length)).join(' · '),
        Math.round(bundle.durationSec / 60),
      )
    : '';

  return (
    <View className="flex-1">
      <DawnBackdrop
        style={dawnScreen}
        glows={[
          { x: 170, y: -60, width: 260, ...GLOW.pinkWide },
          { x: -110, y: 460, width: 260, ...GLOW.periwinkleWide },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        <SafeAreaView edges={['top']} className="px-gutter pt-2">
          <ScreenHeader title={copy?.title ?? t.wishTitle} />
          <Text className={`${type.caption} mt-[6px] text-plum-deep/60`}>{summary}</Text>

          {theme && (
            <View className="mt-4 rounded-[22px]" style={wishHeroShadow}>
              <Image
                source={wishThemeImage[theme]}
                resizeMode="cover"
                className="h-[150px] w-full rounded-[22px]"
              />
            </View>
          )}

          {rituals.isPending ? (
            <ActivityIndicator className="mt-10" color={tokens.colors.plum} />
          ) : !bundle ? (
            <Text className={`${type.body} pt-16 text-center text-ink-soft`}>{t.emptySection}</Text>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.playAll}
                onPress={() => playBundle(bundle)}
                className="mt-[14px] self-start rounded-full bg-plum px-[14px] py-[7px]"
              >
                <Text className={`${type.caption} text-on-photo`}>{`▶  ${t.playAll}`}</Text>
              </Pressable>

              <View className="mt-[18px] gap-3">
                {groups.map((g) => (
                  <View key={g.category} className="gap-3">
                    <Text className={`${type.caption} text-plum-deep/60`}>
                      {t.categories[g.category]}
                    </Text>
                    {g.data.map((item, i) => {
                      const from = bundle.data.indexOf(item);
                      return (
                        <TrackRow
                          key={item.storyId}
                          item={item}
                          index={i}
                          accent
                          onPress={() => openItem(item, bundle.data.slice(from + 1))}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </>
          )}
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
