import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { usePlayerStore } from '@/audio/player-store';
import type { Soundscape } from '@/audio/soundscape';
import { useAuth } from '@/features/auth/auth-provider';
import { useProfile } from '@/features/profile/use-profile';
import { supabase } from '@/lib/supabase';

export type SoundscapeOption = Soundscape & { key: string; name: string };

/**
 * 배경 사운드 목록(공용 카탈로그, RLS: 로그인 사용자 조회). 파일은 public 버킷이라 공개 URL을 쓴다
 * (CLAUDE.md: soundscapes·voice-previews만 public).
 */
export function useSoundscapes() {
  const auth = useAuth();
  return useQuery({
    queryKey: ['soundscapes'],
    enabled: auth.status === 'signed-in',
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<SoundscapeOption[]> => {
      const { data, error } = await supabase
        .from('soundscapes')
        .select('id, key, display_name, storage_path')
        .order('created_at');
      if (error) throw error;
      return data.map((row) => ({
        id: row.id,
        key: row.key,
        name: row.display_name,
        url: supabase.storage.from('soundscapes').getPublicUrl(row.storage_path).data.publicUrl,
      }));
    },
  });
}

/** 앱 시작 때 프로필의 기본 배경 사운드를 플레이어에 한 번 올린다. */
export function useSoundscapeDefault() {
  const profile = useProfile();
  const options = useSoundscapes();
  const current = usePlayerStore((s) => s.soundscape);
  const setSoundscape = usePlayerStore((s) => s.setSoundscape);

  useEffect(() => {
    if (current !== undefined || !profile.data || !options.data) return;
    const preferred = options.data.find((o) => o.id === profile.data.preferredSoundscapeId);
    setSoundscape(preferred ? { id: preferred.id, url: preferred.url } : null);
  }, [current, profile.data, options.data, setSoundscape]);
}

/** 배경 사운드 선택. 바로 플레이어에 반영하고 프로필 기본값(preferred_soundscape_id)으로 저장한다. */
export function useSelectSoundscape() {
  const auth = useAuth();
  const userId = auth.status === 'signed-in' ? auth.session.user.id : undefined;
  const setSoundscape = usePlayerStore((s) => s.setSoundscape);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (option: SoundscapeOption | null) => {
      setSoundscape(option ? { id: option.id, url: option.url } : null);
      if (!userId) return;
      const { error } = await supabase
        .from('profiles')
        .update({ preferred_soundscape_id: option?.id ?? null })
        .eq('id', userId);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['profile', userId] }),
  });
}
