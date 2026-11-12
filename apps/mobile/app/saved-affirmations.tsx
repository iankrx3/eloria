import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DawnBackdrop, GLOW } from '@/components/backgrounds';
import { Icon } from '@/components/icons/icon';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { AffirmationCard } from '@/features/affirmations/affirmation-card';
import { ShareSheet } from '@/features/affirmations/share-sheet';
import {
  useSavedAffirmations,
  useToggleSaveAffirmation,
  type SavedAffirmation,
} from '@/features/affirmations/use-affirmations';
import { ko } from '@/i18n/ko';
import { haptic } from '@/lib/haptics';
import { dawnScreen, shadow } from '@/theme/effects';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

const t = ko.affirmations;

/**
 * 저장한 확언(Figma A04). 최신순, 탭 = 카드로 크게 보기, ♥ = 저장 해제, 길게 누르기 = 복사.
 */
export default function SavedAffirmations() {
  const saved = useSavedAffirmations();
  const toggle = useToggleSaveAffirmation();
  const insets = useSafeAreaInsets();
  const [sharing, setSharing] = useState<string | null>(null);
  const [open, setOpen] = useState<SavedAffirmation | null>(null);
  const [notice, setNotice] = useState<string>();
  const list = saved.data ?? [];

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    haptic('success');
    setNotice(t.copied);
  };

  return (
    <View className="flex-1">
      <DawnBackdrop
        style={dawnScreen}
        glows={[
          { x: 170, y: -60, width: 260, ...GLOW.pinkWide },
          { x: -110, y: 420, width: 240, ...GLOW.periwinkle },
          { x: 80, y: 240, width: 200, ...GLOW.cream },
        ]}
      />
      <SafeAreaView edges={['top']} className="px-gutter pt-2">
        <ScreenHeader title={t.savedList} />
        <Text className={`${type.caption} mt-[6px] text-plum/85`}>{t.savedCount(list.length)}</Text>
        {notice && (
          <Text accessibilityLiveRegion="polite" className={`${type.caption} mt-1 text-plum`}>
            {notice}
          </Text>
        )}
      </SafeAreaView>

      {saved.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={tokens.colors.plum} />
        </View>
      ) : saved.isError ? (
        <View className="flex-1 justify-center px-gutter">
          <PrimaryButton label={ko.common.retry} onPress={() => saved.refetch()} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(a) => a.id}
          contentContainerClassName="gap-3 px-gutter pt-[18px]"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          ListEmptyComponent={
            <Text className={`${type.body} pt-16 text-center text-ink-soft`}>{t.savedEmpty}</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                haptic('light');
                setOpen(item);
              }}
              onLongPress={() => void copy(item.text)}
              className="gap-[10px] rounded-[24px] border border-on-photo bg-on-photo/70 px-5 pb-4 pt-[18px]"
              style={shadow.glass}
            >
              <Text className={`${type.bodyMedium} text-plum-deep`}>{item.text}</Text>
              <View className="flex-row items-center justify-between">
                <Text className={`${type.caption} flex-1 text-plum`}>{item.theme ?? ''}</Text>
                <View className="flex-row gap-[14px]">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.unsave}
                    hitSlop={10}
                    onPress={() => toggle.mutate({ id: item.id, save: false })}
                  >
                    <Icon name="heartFilled" size={18} color={tokens.colors.plum} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.share}
                    hitSlop={10}
                    onPress={() => setSharing(item.text)}
                  >
                    <Icon name="share" size={18} color={tokens.colors.plum} />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* 카드로 크게 보기 */}
      <Modal
        visible={open !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(null)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ko.common.close}
          onPress={() => setOpen(null)}
          className="flex-1 justify-center bg-[rgba(31,26,51,0.45)] px-gutter"
        >
          {open && (
            <AffirmationCard
              text={open.text}
              theme={open.theme}
              saved
              onToggleSave={() =>
                toggle.mutate({ id: open.id, save: false }, { onSuccess: () => setOpen(null) })
              }
              onShare={() => {
                setOpen(null);
                setSharing(open.text);
              }}
            />
          )}
        </Pressable>
      </Modal>

      <ShareSheet text={sharing} onClose={() => setSharing(null)} />
    </View>
  );
}
