import {
  personalProfileSchema,
  profileSettingsSchema,
  storyScenesSchema,
  toCamel,
  type PersonalProfile,
  type ProfileSettings,
  type TablesUpdate,
} from '@eloria/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';

const profileKey = (userId: string | undefined) => ['profile', userId] as const;

/** 본인 프로필(RLS: 본인 행만). 가입 트리거가 빈 행을 만들어 두므로 항상 1행이다. */
export function useProfile() {
  const auth = useAuth();
  const userId = auth.status === 'signed-in' ? auth.session.user.id : undefined;

  return useQuery({
    queryKey: profileKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, display_name, tone, likes, dislikes, onboarding_completed_at, preferred_soundscape_id, preferred_voice_id, location, occupation, desired_changes, story_scenes, narrator_speed, affirmation_notify_at, notify_affirmation, notify_story, notify_challenge, vision_photo_path, challenge_started_on, timezone',
        )
        .eq('id', userId!)
        .single();
      if (error) throw error;
      const row = toCamel(data);
      // jsonb는 형식을 보장하지 않으므로 읽을 때 검증한다(틀리면 빈 목록).
      const scenes = storyScenesSchema.safeParse(row.storyScenes);
      return { ...row, storyScenes: scenes.success ? scenes.data : [] };
    },
  });
}

/**
 * 온보딩 완료 표시. 권한·원가와 무관한 사용자 자신의 상태라 RLS 본인 수정으로 직접 쓴다.
 * `null`을 넘기면 다시 온보딩을 보여 준다(개발용).
 */
export function useSetOnboardingCompleted() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const userId = auth.status === 'signed-in' ? auth.session.user.id : undefined;

  return useMutation({
    mutationFn: async (completed: boolean) => {
      if (!userId) throw new Error('로그인 세션이 없습니다.');
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed_at: completed ? new Date().toISOString() : null })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey(userId) }),
  });
}

/**
 * 마이 탭 Personal 편집(PRD F-11). 사용자 자신의 데이터라 RLS 본인 수정으로 직접 쓰고,
 * 쓰기 전에 공용 스키마로 검증한다. 다음 생성부터 반영된다.
 */
export function useUpdatePersonal() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const userId = auth.status === 'signed-in' ? auth.session.user.id : undefined;

  return useMutation({
    mutationFn: async (patch: Partial<PersonalProfile>) => {
      if (!userId) throw new Error('no session');
      const v = personalProfileSchema.partial().parse(patch);
      const { error } = await supabase
        .from('profiles')
        .update({
          ...(v.displayName !== undefined && { display_name: v.displayName }),
          ...(v.tone !== undefined && { tone: v.tone }),
          ...(v.likes !== undefined && { likes: v.likes }),
          ...(v.dislikes !== undefined && { dislikes: v.dislikes }),
        })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey(userId) }),
  });
}

/** camelCase 설정 → profiles 컬럼 */
function settingsRow(v: Partial<ProfileSettings>): TablesUpdate<'profiles'> {
  return {
    ...(v.location !== undefined && { location: v.location }),
    ...(v.occupation !== undefined && { occupation: v.occupation }),
    ...(v.desiredChanges !== undefined && { desired_changes: v.desiredChanges }),
    ...(v.storyScenes !== undefined && { story_scenes: v.storyScenes }),
    ...(v.narratorSpeed !== undefined && { narrator_speed: v.narratorSpeed }),
    ...(v.preferredVoiceId !== undefined && { preferred_voice_id: v.preferredVoiceId }),
    ...(v.affirmationNotifyAt !== undefined && { affirmation_notify_at: v.affirmationNotifyAt }),
    ...(v.notifyAffirmation !== undefined && { notify_affirmation: v.notifyAffirmation }),
    ...(v.notifyStory !== undefined && { notify_story: v.notifyStory }),
    ...(v.notifyChallenge !== undefined && { notify_challenge: v.notifyChallenge }),
    ...(v.visionPhotoPath !== undefined && { vision_photo_path: v.visionPhotoPath }),
    ...(v.challengeStartedOn !== undefined && { challenge_started_on: v.challengeStartedOn }),
  };
}

/** 마이페이지·설정·목표 수정의 나머지 프로필 값(D-44). RLS 본인 수정, 쓰기 전에 공용 스키마로 검증한다. */
export function useUpdateSettings() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const userId = auth.status === 'signed-in' ? auth.session.user.id : undefined;

  return useMutation({
    mutationFn: async (patch: Partial<ProfileSettings>) => {
      if (!userId) throw new Error('no session');
      const v = profileSettingsSchema.partial().parse(patch);
      const { error } = await supabase.from('profiles').update(settingsRow(v)).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey(userId) }),
  });
}
