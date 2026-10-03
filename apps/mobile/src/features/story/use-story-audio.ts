import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/** 서명 URL 만료(ARCHITECTURE 5절: 1시간, 만료 시 재발급). 만료 전에 다시 받도록 캐시는 50분만 쓴다. */
const SIGNED_URL_SECONDS = 60 * 60;

/**
 * 스토리 음성의 서명 URL. 본인 폴더의 파일은 앱이 직접 서명 URL을 만든다(API.md 2절).
 * 앱은 오디오를 서명 URL로만 받는다(CLAUDE.md 보안 규칙).
 */
export function useStoryAudio(storyId: string, enabled = true) {
  return useQuery({
    queryKey: ['story-audio', storyId],
    enabled,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data: asset, error } = await supabase
        .from('story_assets')
        .select('storage_path, duration_sec')
        .eq('story_id', storyId)
        .eq('type', 'audio')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;

      const { data: signed, error: signError } = await supabase.storage
        .from('story-audio')
        .createSignedUrl(asset.storage_path, SIGNED_URL_SECONDS);
      if (signError) throw signError;

      return { url: signed.signedUrl, durationSec: asset.duration_sec };
    },
  });
}
