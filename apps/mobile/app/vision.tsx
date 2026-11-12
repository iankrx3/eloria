import type { Vision } from '@eloria/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DawnBackdrop, GLOW } from '@/components/backgrounds';
import { Icon } from '@/components/icons/icon';
import { MoonSymbol } from '@/components/moon';
import { PrimaryButton } from '@/components/primary-button';
import { RoundButton } from '@/components/ui';
import { CrisisSupport } from '@/features/safety/crisis-support';
import {
  useCreateVisions,
  useDesireVisions,
  useStartVisionStory,
} from '@/features/vision/use-visions';
import { ko } from '@/i18n/ko';
import { ApiClientError } from '@/lib/api-client';
import { haptic } from '@/lib/haptics';
import { visionCard, visionScreen } from '@/theme/effects';
import { storyCover } from '@/theme/images';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

const t = ko.vision;
const GAP = 12;

/**
 * 비전 고르기(Figma H05). 홈에서 꿈을 보내면 장면 4개를 만들고(그동안 H04처럼 기다림),
 * 좌우로 넘겨 하나를 재생하면 그 장면만 이야기로 만든다(H06 → H07). 나머지는 누를 때 만든다.
 */
export default function VisionScreen() {
  const params = useLocalSearchParams<{ text?: string; desireId?: string }>();
  const create = useCreateVisions();
  const saved = useDesireVisions(params.desireId);
  const start = useStartVisionStory();
  const { width } = useWindowDimensions();
  const card = Math.min(276, width - 84);
  const [active, setActive] = useState(0);
  const requested = useRef(false);

  // 처음 들어오면 한 번만 만든다. 다 만들면 desireId로 바꿔 다시 열어도 같은 장면을 본다.
  useEffect(() => {
    if (!params.text || params.desireId || requested.current) return;
    requested.current = true;
    create.mutate(
      { text: params.text },
      {
        onSuccess: (res) => {
          if (!res.blocked) router.setParams({ desireId: res.desireId, text: undefined });
        },
      },
    );
  }, [params.text, params.desireId, create]);

  const desireId = params.desireId ?? create.data?.desireId;
  const visions: Vision[] = saved.data ?? create.data?.visions ?? [];
  const blocked = create.data?.blocked;
  const pending = create.isPending || (Boolean(params.desireId) && saved.isPending);

  const play = (v: Vision) => {
    if (!desireId || start.isPending) return;
    haptic('light');
    start.mutate(
      { desireId, position: v.position },
      {
        onSuccess: ({ storyId }) =>
          router.replace({ pathname: '/manifest/[id]/progress', params: { id: storyId } }),
        onError: () => haptic('error'),
      },
    );
  };

  if (blocked === 'SAFETY_CRISIS') {
    return (
      <View className="flex-1" style={visionScreen}>
        <SafeAreaView edges={['top', 'bottom']} className="flex-1 px-gutter pt-2">
          <RoundButton icon="back" label={ko.common.back} onPress={() => router.back()} />
          <View className="mt-6">
            <CrisisSupport />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const error =
    blocked === 'SAFETY_BLOCKED'
      ? t.blocked
      : create.error instanceof ApiClientError && create.error.code === 'RATE_LIMITED'
        ? create.error.message
        : create.isError || saved.isError || start.isError
          ? t.failed
          : undefined;

  return (
    <View className="flex-1">
      <DawnBackdrop
        style={visionScreen}
        glows={[
          { x: 180, y: 40, width: 260, ...GLOW.pinkWide },
          { x: -80, y: 480, width: 240, ...GLOW.periwinkle },
        ]}
      />
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 pt-2">
        <View className="px-gutter">
          <RoundButton icon="back" label={ko.common.back} onPress={() => router.back()} />
        </View>

        {pending ? (
          <View className="flex-1 items-center justify-center gap-4 px-gutter">
            <MoonSymbol size={56} pulse />
            <Text accessibilityRole="header" className={`${type.h2} text-center text-plum-deep`}>
              {t.making}
            </Text>
            <Text className={`${type.body} text-center text-ink-soft`}>{t.makingSub}</Text>
          </View>
        ) : error || visions.length === 0 ? (
          <View className="flex-1 justify-center gap-4 px-gutter">
            <Text
              accessibilityLiveRegion="polite"
              className={`${type.body} text-center text-ink-soft`}
            >
              {error ?? t.failed}
            </Text>
            <PrimaryButton variant="ghost" label={t.back} onPress={() => router.back()} />
          </View>
        ) : (
          <>
            <Text
              accessibilityRole="header"
              className={`${type.h1} mt-[18px] px-gutter text-center text-plum-deep`}
            >
              {t.headline}
            </Text>
            <FlatList
              data={visions}
              keyExtractor={(v) => String(v.position)}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={card + GAP}
              decelerationRate="fast"
              className="mt-[26px] grow-0"
              contentContainerStyle={{ paddingHorizontal: (width - card) / 2, gap: GAP }}
              onScroll={(e) => {
                const i = Math.round(e.nativeEvent.contentOffset.x / (card + GAP));
                if (i !== active && i >= 0 && i < visions.length) {
                  haptic('selection');
                  setActive(i);
                }
              }}
              scrollEventThrottle={32}
              renderItem={({ item, index }) => (
                <VisionCard
                  vision={item}
                  image={storyCover(`${desireId}:${item.position}`)}
                  width={card}
                  active={index === active}
                  count={visions.length}
                  busy={start.isPending && start.variables?.position === item.position}
                  onPlay={() => play(item)}
                />
              )}
            />
            <Text className={`${type.caption} mt-4 text-center text-plum-deep/55`}>{t.hint}</Text>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

function VisionCard({
  vision,
  image,
  width,
  active,
  count,
  busy,
  onPlay,
}: {
  vision: Vision;
  image: ReturnType<typeof storyCover>;
  width: number;
  active: boolean;
  count: number;
  busy: boolean;
  onPlay: () => void;
}) {
  return (
    <View
      className="overflow-hidden rounded-[28px] bg-pearl"
      style={[
        { width, opacity: active ? 1 : 0.55, transform: [{ scale: active ? 1 : 0.88 }] },
        visionCard,
      ]}
    >
      <View style={{ height: (width * 250) / 276 }}>
        <Image source={image} resizeMode="cover" className="absolute inset-0 h-full w-full" />
        <Text
          className="absolute left-[18px] top-4 font-display-semibold text-[11px] tracking-[2.42px] text-on-photo"
          style={{
            textShadowColor: 'rgba(46,31,64,0.55)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 6,
          }}
        >
          {ko.vision.label(vision.position)}
        </Text>
      </View>
      <View className="gap-[18px] px-[22px] pb-[22px] pt-5">
        <Text numberOfLines={2} className={`${type.h2} text-plum-deep`}>
          {vision.title}
        </Text>
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ko.vision.play(vision.title)}
            accessibilityState={{ busy }}
            disabled={busy}
            onPress={onPlay}
            className="h-[52px] w-[52px] items-center justify-center rounded-full bg-plum"
          >
            {busy ? (
              <ActivityIndicator color={tokens.colors['on-photo']} />
            ) : (
              <Icon name="play" size={22} color={tokens.colors['on-photo']} />
            )}
          </Pressable>
          <View className="flex-row items-center gap-[6px]">
            {Array.from({ length: count }, (_, i) => (
              <View
                key={i}
                className={`h-[6px] rounded-[3px] ${
                  i === vision.position - 1 ? 'w-5 bg-plum' : 'w-[6px] bg-plum-deep/20'
                }`}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
