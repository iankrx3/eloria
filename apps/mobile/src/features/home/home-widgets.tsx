import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHALLENGE_DAYS } from '@eloria/shared';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/icons/icon';
import { MoonSymbol } from '@/components/moon';
import { useActivity, useChallenge } from '@/features/activity/use-activity';
import { usePickVisionPhoto, useVisionPhotoUrl } from '@/features/vision/use-vision-photo';
import { useCurrentVoice } from '@/features/voice/voice-sheet';
import { ko } from '@/i18n/ko';
import { haptic } from '@/lib/haptics';
import { dawnHorizontal, shadow } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

/** 상단 오른쪽 칩 하나(Figma H01 Voice·Streak) */
function TopChip({
  icon,
  label,
  a11y,
  onPress,
}: {
  icon: 'voice' | 'flame';
  label: string;
  a11y: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={() => {
        haptic('light');
        onPress();
      }}
      className="flex-row items-center gap-[6px] rounded-full border border-on-photo/90 bg-on-photo/60 px-[13px] py-2"
      style={shadow.chip}
    >
      <Icon
        name={icon}
        size={16}
        color={icon === 'flame' ? tokens.colors.amber : tokens.colors.plum}
      />
      <Text className={`${type.caption} text-plum-deep`}>{label}</Text>
    </Pressable>
  );
}

/** 목소리 칩(→ 목소리 고르기 시트) + 연속 기록 칩(→ H11) */
export function HomeTopChips({ onVoice }: { onVoice: () => void }) {
  const voice = useCurrentVoice();
  const { stats } = useActivity();
  const voiceName = voice?.name ?? ko.voice.defaultName;
  return (
    <View className="flex-row gap-2">
      <TopChip
        icon="voice"
        label={voiceName}
        a11y={`${ko.voice.title} ${voiceName}`}
        onPress={onVoice}
      />
      <TopChip
        icon="flame"
        label={String(stats.current)}
        a11y={ko.streak.chip(stats.current)}
        onPress={() => router.push('/streak')}
      />
    </View>
  );
}

/** 초승달 오른쪽 아래 비전 사진 배지(Figma H01 Vision photo 34×34). 사진이 있으면 그 사진을 보여 준다. */
export function VisionBadge() {
  const url = useVisionPhotoUrl();
  const pick = usePickVisionPhoto();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={ko.home.visionPhoto}
      onPress={() => {
        haptic('light');
        pick.mutate();
      }}
      className="absolute left-[190px] top-[116px] h-[34px] w-[34px] items-center justify-center overflow-hidden rounded-full border-2 border-on-photo bg-plum-deep"
      style={{ boxShadow: '0px 4px 10px 0px rgba(62,42,79,0.25)' }}
    >
      {pick.isPending ? (
        <ActivityIndicator size="small" color={tokens.colors['on-photo']} />
      ) : url.data ? (
        <Image source={{ uri: url.data }} className="h-full w-full" />
      ) : (
        <Icon name="camera" size={16} color={tokens.colors['on-photo']} />
      )}
    </Pressable>
  );
}

const NOTICE_KEY = 'home.notice.dismissed';

/** 챌린지 알림 카드(Figma Home / Notification). ×로 닫으면 상태가 바뀔 때까지 다시 보이지 않는다. */
export function ChallengeNotice() {
  const { state } = useChallenge();
  const kind = state.started ? 'started' : 'invite';
  const [dismissed, setDismissed] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    void AsyncStorage.getItem(NOTICE_KEY).then(setDismissed);
  }, []);

  if (dismissed === undefined || dismissed === kind || state.finished) return null;

  return (
    <View
      className="flex-row items-center gap-3 rounded-[18px] border border-on-photo bg-on-photo/70 py-3 pl-3 pr-[14px]"
      style={{ boxShadow: '0px 6px 9px 0px rgba(62,42,79,0.08)' }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={state.started ? ko.challenge.noticeStarted : ko.challenge.noticeInvite}
        onPress={() => {
          haptic('light');
          router.push('/challenge');
        }}
        className="flex-1 flex-row items-center gap-3"
      >
        <View
          className="h-10 w-10 items-center justify-center overflow-hidden rounded-xl"
          style={dawnHorizontal}
        >
          <MoonSymbol size={20} />
        </View>
        <View className="flex-1 gap-[2px]">
          <Text className="font-display-semibold text-[14px] tracking-[1.68px] text-plum-deep">
            {ko.brand.name}
          </Text>
          <Text className={`${type.caption} text-plum-deep/85`}>
            {state.started ? ko.challenge.noticeStarted : ko.challenge.noticeInvite}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ko.challenge.dismiss}
        hitSlop={10}
        onPress={() => {
          haptic('light');
          setDismissed(kind);
          void AsyncStorage.setItem(NOTICE_KEY, kind);
        }}
      >
        <Icon name="close" size={16} color={tokens.colors['ink-faint']} />
      </Pressable>
    </View>
  );
}

/** 21일 챌린지 카드(Figma H01 Challenge): 21개 점으로 진행을 보여 준다. */
export function ChallengeCard() {
  const { state } = useChallenge();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${ko.challenge.homeCardTitle} ${state.completed} / ${CHALLENGE_DAYS}`}
      onPress={() => {
        haptic('light');
        router.push('/challenge');
      }}
      className="gap-[10px] rounded-[22px] border border-on-photo bg-on-photo/60 px-5 py-[18px]"
    >
      <View className="flex-row items-center justify-between">
        <Text className={`${type.bodyMedium} text-plum-deep`}>{ko.challenge.homeCardTitle}</Text>
        <Text
          className={`${type.caption} text-plum`}
        >{`${state.completed} / ${CHALLENGE_DAYS}`}</Text>
      </View>
      <View className="flex-row justify-between">
        {Array.from({ length: CHALLENGE_DAYS }, (_, i) => (
          <View
            key={i}
            className={`h-[9px] w-[9px] rounded-full ${i < state.completed ? 'bg-plum' : 'bg-plum-deep/15'}`}
          />
        ))}
      </View>
      <Text className={`${type.caption} text-ink-soft`}>
        {state.started ? ko.challenge.homeCardHint : ko.challenge.homeCardStart}
      </Text>
    </Pressable>
  );
}
