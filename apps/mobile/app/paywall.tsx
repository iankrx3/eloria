import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons/icon';
import { PrimaryButton } from '@/components/primary-button';
import { RoundButton } from '@/components/ui';
import { PAYWALL_PREVIEW, won } from '@/features/paywall/plans';
import { ko } from '@/i18n/ko';
import { paywallPhotoFade, paywallScreen, shadow } from '@/theme/effects';
import { scenes } from '@/theme/images';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';
import { haptic } from '@/lib/haptics';

type Plan = 'yearly' | 'monthly';

/**
 * 페이월(Figma H09). 온보딩을 마치고 홈에 처음 들어왔을 때 한 번 뜬다.
 * 결제(RevenueCat)는 M5에서 붙인다. 그 전까지 버튼은 안내만 하고 닫는다.
 */
export default function Paywall() {
  const t = ko.onboarding;
  const [plan, setPlan] = useState<Plan>('yearly');
  const [canClose, setCanClose] = useState(false);
  const [notice, setNotice] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanClose(true), PAYWALL_PREVIEW.closeDelayMs);
    return () => clearTimeout(timer);
  }, []);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View className="flex-1" style={paywallScreen}>
      <View className="absolute inset-x-0 top-0 h-[330px]">
        <Image source={scenes.dawnRiver} resizeMode="cover" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, paywallPhotoFade]} />
      </View>
      <SafeAreaView className="flex-1">
        <View className="h-10 flex-row justify-end px-gutter pt-1">
          {canClose && (
            <RoundButton
              icon="close"
              label={ko.common.close}
              tone="photo"
              size={36}
              iconSize={16}
              onPress={close}
            />
          )}
        </View>
        <ScrollView contentContainerClassName="px-gutter pb-7 pt-[150px]">
          <Text className={`${type.labelSmall} text-plum`}>{t.paywallLabel}</Text>
          <Text accessibilityRole="header" className={`${type.h1} mt-2 text-plum-deep`}>
            {t.paywallTitle}
          </Text>

          <View className="mt-[18px] gap-[10px]">
            {t.paywallBenefits.map((b) => (
              <View key={b} className="flex-row items-center gap-[10px]">
                <View className="h-[22px] w-[22px] items-center justify-center rounded-full bg-plum/15">
                  <Icon name="checkSmall" size={13} color={tokens.colors.plum} />
                </View>
                <Text className={`${type.body} text-plum-deep/90`}>{b}</Text>
              </View>
            ))}
          </View>

          <View accessibilityRole="radiogroup" className="mt-5 flex-row gap-3">
            <PlanCard
              selected={plan === 'yearly'}
              onPress={() => setPlan('yearly')}
              name={t.planYearly}
              price={`₩${won(PAYWALL_PREVIEW.yearlyWon)}`}
              note={t.perMonth(won(Math.round(PAYWALL_PREVIEW.yearlyWon / 12 / 100) * 100))}
              badge={t.planPopular}
            />
            <PlanCard
              selected={plan === 'monthly'}
              onPress={() => setPlan('monthly')}
              name={t.planMonthly}
              price={`₩${won(PAYWALL_PREVIEW.monthlyWon)}`}
              note={t.planMonthlyNote}
            />
          </View>

          <View className="mt-[18px]">
            <PrimaryButton label={t.paywallCta} onPress={() => setNotice(true)} />
          </View>
          <Text className={`${type.caption} mt-[10px] text-center text-ink-soft`}>
            {notice ? t.paywallPending : t.paywallNote}
          </Text>
          <Text className={`${type.caption} mt-2 text-center text-ink-faint`}>
            {`${t.restore}   ·   ${t.terms}   ·   ${t.privacy}`}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function PlanCard({
  selected,
  onPress,
  name,
  price,
  note,
  badge,
}: {
  selected: boolean;
  onPress: () => void;
  name: string;
  price: string;
  note: string;
  badge?: string;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${name} ${price}`}
      onPress={() => {
        haptic('selection');
        onPress();
      }}
      className={`flex-1 gap-1 rounded-[18px] px-4 pb-[14px] pt-4 ${
        selected
          ? 'border-[1.5px] border-plum bg-on-photo'
          : 'border border-on-photo bg-on-photo/60'
      }`}
      style={selected ? shadow.photoCard : undefined}
    >
      <Text className={`${type.bodyMedium} text-plum-deep`}>{name}</Text>
      <Text className={`${type.h2} ${selected ? 'text-plum' : 'text-plum-deep'}`}>{price}</Text>
      <Text className={`${type.caption} text-ink-soft`}>{note}</Text>
      {badge && (
        <View className="absolute -top-3 self-center rounded-full bg-plum px-2 py-[3px]">
          <Text className={`${type.caption} text-on-photo`}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}
