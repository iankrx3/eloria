import * as Clipboard from 'expo-clipboard';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { Image, Modal, Pressable, Share, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { Icon, type IconName } from '@/components/icons/icon';
import { Logo } from '@/components/logo';
import { ko } from '@/i18n/ko';
import { haptic } from '@/lib/haptics';
import { shareGradientBackground, shareImageShadow, shareSheet, shareText } from '@/theme/effects';
import { shareBackgrounds } from '@/theme/images';
import tokens from '@/theme/tokens.json';
import { type } from '@/theme/typography';

const t = ko.affirmations;

/** 미리보기 크기(Figma 198×352)와 저장 이미지 크기(9:16, 1080×1920) */
const PREVIEW = { width: 198, height: 352 };
const OUTPUT = { width: 1080, height: 1920 };
/** 사진 4장 + 마지막은 그라디언트 */
const GRADIENT = shareBackgrounds.length;

type Target = 'story' | 'message' | 'save' | 'copy';
const TARGETS: { key: Target; icon: IconName }[] = [
  { key: 'story', icon: 'instagram' },
  { key: 'message', icon: 'message' },
  { key: 'save', icon: 'download' },
  { key: 'copy', icon: 'link' },
];

/**
 * 확언 공유(Figma A05): 9:16 이미지 미리보기, 배경 고르기, 공유 대상.
 * 인스타 스토리는 시스템 공유 창으로 이미지를 넘긴다(스토리 직접 연동은 Meta 앱 등록 후, Q-16).
 * "링크 복사"는 공유할 웹 링크가 아직 없어 문구 복사로 둔다.
 */
export function ShareSheet({ text, onClose }: { text: string | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const shot = useRef<View>(null);
  const [background, setBackground] = useState(0);
  const [notice, setNotice] = useState<string>();
  const [busy, setBusy] = useState(false);
  const visible = text !== null;

  useEffect(() => {
    if (visible) {
      haptic('light');
      setNotice(undefined);
    }
  }, [visible]);

  const capture = () =>
    captureRef(shot, { format: 'png', quality: 1, result: 'tmpfile', ...OUTPUT });

  const run = async (target: Target) => {
    if (!text || busy) return;
    haptic('light');
    setBusy(true);
    setNotice(undefined);
    try {
      switch (target) {
        case 'story': {
          const uri = await capture();
          await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t.shareTitle });
          break;
        }
        case 'message':
          await Share.share({ message: `${text}\n\n— ${ko.brand.name}` });
          break;
        case 'save': {
          const permission = await requestPermissionsAsync(true);
          if (!permission.granted) {
            setNotice(t.permissionDenied);
            break;
          }
          await Asset.create(await capture());
          haptic('success');
          setNotice(t.savedImage);
          break;
        }
        case 'copy':
          await Clipboard.setStringAsync(text);
          haptic('success');
          setNotice(t.copied);
          break;
      }
    } catch {
      haptic('error');
      setNotice(t.shareFailed);
    } finally {
      setBusy(false);
    }
  };

  const onGradient = background === GRADIENT;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ko.common.close}
        onPress={onClose}
        className="flex-1 items-center bg-[rgba(31,26,51,0.45)]"
        style={{ paddingTop: insets.top + 46 }}
      >
        {/* 저장·공유되는 이미지. 미리보기 크기로 그리고 캡처할 때 1080×1920으로 키운다. */}
        <View style={[PREVIEW, shareImageShadow]} className="rounded-[20px]">
          <View
            ref={shot}
            collapsable={false}
            className="flex-1 items-center justify-center gap-[14px] overflow-hidden rounded-[20px] px-[18px]"
            style={onGradient ? shareGradientBackground : undefined}
          >
            {!onGradient && (
              <>
                <Image
                  source={shareBackgrounds[background]}
                  resizeMode="cover"
                  className="absolute inset-0 h-full w-full"
                />
                <View className="absolute inset-0 bg-[rgba(46,33,64,0.35)]" />
              </>
            )}
            <Icon name="moonSolid" size={18} color={tokens.colors.amber} />
            <Text
              className={`${type.h2} text-center ${onGradient ? 'text-plum-deep' : 'text-on-photo'}`}
              style={onGradient ? undefined : shareText}
            >
              {text}
            </Text>
            <View className="absolute bottom-[18px]">
              <Logo size={25} tone={onGradient ? 'light' : 'photo'} />
            </View>
          </View>
        </View>
      </Pressable>

      <View
        className="absolute bottom-0 left-0 right-0 gap-[18px] rounded-t-[24px] px-6 pt-3"
        style={[shareSheet, { paddingBottom: insets.bottom + 36 }]}
      >
        <View className="items-center">
          <View className="h-1 w-9 rounded-[2px] bg-plum-deep/20" />
        </View>
        <Text accessibilityRole="header" className={`${type.h2} text-plum-deep`}>
          {t.shareTitle}
        </Text>

        <View accessibilityRole="radiogroup" className="flex-row gap-[10px]">
          {[...shareBackgrounds.map((_, i) => i), GRADIENT].map((i) => {
            const selected = background === i;
            return (
              <Pressable
                key={i}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={i === GRADIENT ? t.backgroundGradient : t.background(i + 1)}
                onPress={() => {
                  haptic('selection');
                  setBackground(i);
                }}
                className={`h-14 w-11 overflow-hidden rounded-[10px] ${
                  selected
                    ? 'border-[2.5px] border-plum'
                    : i === GRADIENT
                      ? 'border border-on-photo'
                      : ''
                }`}
                style={i === GRADIENT ? shareGradientBackground : undefined}
              >
                {i !== GRADIENT && (
                  <Image
                    source={shareBackgrounds[i]}
                    resizeMode="cover"
                    className="h-full w-full"
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row justify-between">
          {TARGETS.map(({ key, icon }) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={t.targets[key]}
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={() => void run(key)}
              className="items-center gap-2"
            >
              <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-on-photo/80">
                <Icon name={icon} size={26} color={tokens.colors.plum} />
              </View>
              <Text className={`${type.caption} text-plum-deep/80`}>{t.targets[key]}</Text>
            </Pressable>
          ))}
        </View>
        {notice && (
          <Text
            accessibilityLiveRegion="polite"
            className={`${type.caption} text-center text-plum`}
          >
            {notice}
          </Text>
        )}
      </View>
    </Modal>
  );
}
