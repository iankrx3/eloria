import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/features/auth/auth-provider';
import { useProfile, useUpdateSettings } from '@/features/profile/use-profile';
import { haptic } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

const BUCKET = 'vision-photos';
const SIGNED_URL_TTL = 60 * 60;

/**
 * 홈 "내 비전 사진"(Figma H01 📷). 앨범에서 고른 사진을 private 버킷 vision-photos/{user_id}/에 올리고
 * 서명 URL로만 보여 준다(CLAUDE.md 이미지 규칙, D-44).
 */
export function useVisionPhotoUrl() {
  const path = useProfile().data?.visionPhotoPath ?? null;
  return useQuery({
    queryKey: ['vision-photo', path],
    enabled: Boolean(path),
    staleTime: (SIGNED_URL_TTL - 60) * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path!, SIGNED_URL_TTL);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

export function usePickVisionPhoto() {
  const auth = useAuth();
  const userId = auth.status === 'signed-in' ? auth.session.user.id : undefined;
  const update = useUpdateSettings();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<boolean> => {
      if (!userId) throw new Error('no session');
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (picked.canceled || !picked.assets[0]) return false;
      const asset = picked.assets[0];
      const contentType = asset.mimeType ?? 'image/jpeg';
      const ext =
        contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
      // 같은 경로에 덮어쓰면 서명 URL 캐시가 남으므로 시각을 붙인다.
      const path = `${userId}/vision-${Date.now()}.${ext}`;
      const body = await (await fetch(asset.uri)).arrayBuffer();
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, body, { contentType, upsert: false });
      if (error) throw error;
      await update.mutateAsync({ visionPhotoPath: path });
      return true;
    },
    onSuccess: (changed) => {
      if (!changed) return;
      haptic('success');
      void queryClient.invalidateQueries({ queryKey: ['vision-photo'] });
    },
    onError: (e) => {
      haptic('error');
      if (__DEV__) console.warn('[vision] upload failed', e);
    },
  });
}
