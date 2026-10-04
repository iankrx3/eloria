import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { usePlayerStore } from '@/audio/player-store';
import { SOUNDSCAPE_VOLUME, type SoundscapeVolume } from '@/audio/soundscape';
import { useSelectSoundscape, useSoundscapes } from '@/features/soundscape/use-soundscapes';
import { ko } from '@/i18n/ko';
import tokens from '@/theme/tokens.json';

function Chip({
  label,
  selected,
  onPress,
  role,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  role: 'radio';
}) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      className={`rounded-full px-4 py-2 ${selected ? 'bg-on-dusk' : 'bg-on-dusk/15'}`}
    >
      <Text className={`text-[13px] ${selected ? 'text-plum-deep' : 'text-on-dusk'}`}>{label}</Text>
    </Pressable>
  );
}

/** 배경 사운드 선택과 볼륨(PRD F-08). 고른 사운드는 다음에도 기본값으로 쓴다. */
export function SoundscapePanel() {
  const options = useSoundscapes();
  const select = useSelectSoundscape();
  const current = usePlayerStore((s) => s.soundscape);
  const volume = usePlayerStore((s) => s.soundscapeVolume);
  const setVolume = usePlayerStore((s) => s.setSoundscapeVolume);

  return (
    <View className="gap-5 rounded-card bg-on-dusk/10 p-4">
      <View className="gap-3">
        <Text accessibilityRole="header" className="text-[13px] text-on-dusk/80">
          {ko.player.soundscape}
        </Text>
        {options.isPending ? (
          <ActivityIndicator color={tokens.colors.glow} />
        ) : options.isError ? (
          <Text className="text-[13px] text-on-dusk/80">{ko.player.soundscapeFailed}</Text>
        ) : (
          <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
            <Chip
              role="radio"
              label={ko.player.soundscapeNone}
              selected={!current}
              onPress={() => select.mutate(null)}
            />
            {options.data.map((o) => (
              <Chip
                key={o.id}
                role="radio"
                label={o.name}
                selected={current?.id === o.id}
                onPress={() => select.mutate(o)}
              />
            ))}
          </View>
        )}
      </View>
      {current && (
        <View className="gap-3">
          <Text className="text-[13px] text-on-dusk/80">{ko.player.volume}</Text>
          <View accessibilityRole="radiogroup" className="flex-row gap-2">
            {(Object.keys(SOUNDSCAPE_VOLUME) as SoundscapeVolume[]).map((v) => (
              <Chip
                key={v}
                role="radio"
                label={ko.player.volumeLevels[v]}
                selected={volume === v}
                onPress={() => setVolume(v)}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
