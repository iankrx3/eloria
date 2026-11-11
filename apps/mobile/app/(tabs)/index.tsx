import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DawnBackdrop, GLOW } from '@/components/backgrounds';
import { Icon } from '@/components/icons/icon';
import { Logo } from '@/components/logo';
import { MoonHero } from '@/components/moon';
import { SectionHeader } from '@/components/ui';
import { HomeStoryCard } from '@/features/home/story-card';
import { useMyStories } from '@/features/library/use-library';
import { ManifestInput } from '@/features/manifest/manifest-input';
import { useBottomSpace } from '@/features/navigation/tab-bar';
import { useProfile } from '@/features/profile/use-profile';
import { ko } from '@/i18n/ko';
import { dawnScreen, shadow } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';
import { haptic } from '@/lib/haptics';

const FOR_YOU_LIMIT = 10;

/**
 * 홈(Figma H01). 오늘의 달 · 인사 · 꿈 입력 · 추천 칩 · 당신을 위한 이야기.
 * 보이스 칩·연속 기록·비전 사진·다음 이야기 카운트다운·21일 챌린지는 기능이 생기면 붙인다(ROADMAP M7).
 */
export default function Home() {
  const name = useProfile().data?.displayName ?? null;
  const stories = useMyStories();
  const bottom = useBottomSpace();
  const [text, setText] = useState('');
  const { welcome } = useLocalSearchParams<{ welcome?: string }>();
  const shownWelcome = useRef(false);

  // 온보딩을 마치고 처음 들어오면 페이월을 한 번 보여 준다(Figma C4·H09 노트).
  useEffect(() => {
    if (welcome === '1' && !shownWelcome.current) {
      shownWelcome.current = true;
      router.setParams({ welcome: undefined });
      router.push('/paywall');
    }
  }, [welcome]);

  // 다른 화면에서 만든 이야기·생성 상태가 바로 보이도록 탭에 들어올 때마다 다시 읽는다.
  useFocusEffect(
    useCallback(() => {
      void stories.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch는 안정적이며 포커스마다 한 번만 부른다.
    }, []),
  );

  const list = (stories.data ?? []).slice(0, FOR_YOU_LIMIT);

  return (
    <View className="flex-1">
      {/* 입력창에 포커스가 가면 키보드 위로 올라오도록 스크롤한다(Android edge-to-edge 포함). */}
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom, flexGrow: 1 }}
      >
        <DawnBackdrop
          style={dawnScreen}
          glows={[
            { x: 170, y: -60, width: 260, ...GLOW.pink },
            { x: -110, y: 120, width: 240, ...GLOW.periwinkle },
            { x: 90, y: 90, width: 200, ...GLOW.cream },
            { x: 140, y: 430, width: 260, height: 200, ...GLOW.lilac },
            { x: -110, y: 900, width: 260, ...GLOW.periwinkleWide },
          ]}
        />
        <SafeAreaView edges={['top']} className="items-center px-gutter pt-2">
          <View className="w-full flex-row items-center justify-between">
            <Logo size={32} />
          </View>

          <View className="mt-[6px]">
            <MoonHero />
          </View>

          <Text accessibilityRole="header" className={`${type.h1} mt-2 text-center text-plum-deep`}>
            {`${ko.home.greeting(name)}\n${ko.home.question}`}
            <Text className="text-plum">{ko.home.questionAccent}</Text>
          </Text>
          <Text className={`${type.body} mt-[6px] text-center text-ink-soft`}>
            {ko.brand.slogan}
          </Text>

          <View className="mt-5 w-full">
            <ManifestInput
              value={text}
              onChangeText={setText}
              onCreated={(storyId) =>
                router.push({ pathname: '/manifest/[id]/progress', params: { id: storyId } })
              }
            />
          </View>
        </SafeAreaView>

        {/* 추천 칩: 탭하면 예시 문장을 입력창에 채운다(고쳐 쓸 수 있다). */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          className="mt-3 shrink-0 grow-0"
          contentContainerClassName="gap-2 px-gutter"
        >
          {ko.home.suggestions.map((s) => (
            <Pressable
              key={s.label}
              accessibilityRole="button"
              accessibilityLabel={s.label}
              onPress={() => {
                haptic('light');
                setText(s.text);
              }}
              className="rounded-full border border-on-photo/80 bg-on-photo/55 px-[14px] py-[7px]"
            >
              <Text className={`${type.caption} text-plum-deep`}>{s.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View className="mt-6 px-gutter">
          <SectionHeader
            title={ko.home.forYou}
            action={
              list.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${ko.home.forYou} ${ko.common.seeAll}`}
                  onPress={() => {
                    haptic('light');
                    router.push('/stories');
                  }}
                  className="flex-row items-center gap-[6px] rounded-full border border-on-photo bg-on-photo/70 py-[7px] pl-3 pr-[14px]"
                >
                  <Icon name="library" size={14} color={tokens.colors['plum-deep']} />
                  <Text className={`${type.caption} text-plum-deep`}>{ko.common.seeAll}</Text>
                </Pressable>
              ) : undefined
            }
          />
        </View>

        {list.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3 shrink-0 grow-0"
            contentContainerClassName="gap-[14px] px-gutter pb-6"
          >
            {list.map((story) => (
              <HomeStoryCard key={story.id} story={story} />
            ))}
          </ScrollView>
        ) : (
          <View
            className="mx-gutter mt-3 items-center rounded-[22px] border border-on-photo bg-on-photo/60 px-5 py-8"
            style={shadow.glass}
          >
            <Text className={`${type.body} text-center text-ink-soft`}>
              {stories.isPending ? ko.common.loading : ko.home.emptyStories}
            </Text>
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}
