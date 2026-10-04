import {
  collectQuizAnswers,
  type QuizAnswers,
  type ScenePlan,
  type StoryStatus,
} from '@eloria/shared';
import type { Usage } from '@eloria/providers';
import type { AdminClient } from '../lib/supabase-admin';

export type StoryJobContext = {
  storyId: string;
  /** null = 공용 Library 스토리(리추얼). 파일은 library/ 폴더에, 기록은 kind=library로 남는다. */
  userId: string | null;
  dream: string;
  displayName: string | null;
  profileTone: 'calm' | 'excited' | 'powerful' | null;
  preferredVoiceId: string | null;
  likes: string[];
  dislikes: string[];
  people: { name: string; relation: string }[];
  quiz: Partial<QuizAnswers>;
};

export type CallRecord = {
  userId: string | null;
  storyId: string;
  step: string;
  usage: Usage;
  startedAt: string;
  finishedAt: string;
};

export type AudioAsset = {
  userId: string | null;
  storyId: string;
  bytes: Uint8Array;
  mime: string;
  durationSec: number;
  contentHash: string;
  provider: string;
  model: string;
};

export interface PipelineRepo {
  loadContext(storyId: string): Promise<StoryJobContext>;
  setStatus(storyId: string, status: StoryStatus, errorCode?: string | null): Promise<void>;
  getStatus(storyId: string): Promise<StoryStatus>;
  saveText(
    storyId: string,
    text: { scenePlan: ScenePlan; script: string; promptVersion: string },
  ): Promise<void>;
  /** 외부 AI 호출 1회를 generation_jobs에 기록한다(모델·토큰·글자 수·추정 비용). */
  recordCall(call: CallRecord): Promise<void>;
  /** API가 만든 queued 작업 행을 전체 진행 상태로 갱신한다. */
  updateStoryJob(
    storyId: string,
    step: string,
    status: 'running' | 'succeeded' | 'failed',
    error?: string,
  ): Promise<void>;
  /** 같은 해시의 음성이 이미 있으면 그 파일을 새 경로로 복사해 쓴다(재생성 없음). */
  reuseAudio(storyId: string, userId: string | null, contentHash: string): Promise<boolean>;
  saveAudio(asset: AudioAsset): Promise<void>;
  resolveVoiceId(
    voiceKey: string | undefined,
    preferredVoiceId: string | null,
  ): Promise<string | null>;
}

const audioPath = (userId: string | null, storyId: string, assetId: string, ext: string) =>
  `${userId ?? 'library'}/${storyId}/${assetId}.${ext}`;
const jobKind = (userId: string | null) => (userId ? 'story' : 'library');
const extFor = (mime: string) => (mime === 'audio/wav' ? 'wav' : 'mp3');

const asTone = (tone: string | null) =>
  tone === 'calm' || tone === 'excited' || tone === 'powerful' ? tone : null;

/** 리추얼 스토리는 개인 정보 없이 테마만으로 만든다. 이름 대신 "당신"으로 부른다. */
function libraryContext(storyId: string, theme: string, tone: string): StoryJobContext {
  return {
    storyId,
    userId: null,
    dream: theme,
    displayName: null,
    profileTone: asTone(tone),
    preferredVoiceId: null,
    likes: [],
    dislikes: [],
    people: [],
    quiz: {},
  };
}

export function createSupabasePipelineRepo(db: AdminClient): PipelineRepo {
  return {
    async loadContext(storyId) {
      const { data: story, error } = await db
        .from('stories')
        .select('id, user_id, kind, desires(text), library_items(theme, tone)')
        .eq('id', storyId)
        .single();
      if (error) throw error;

      if (story.kind === 'library') {
        const item = story.library_items;
        if (!item) throw new Error(`리추얼 항목이 없습니다: ${storyId}`);
        return libraryContext(storyId, item.theme, item.tone);
      }
      if (!story.user_id) throw new Error(`사용자 스토리가 아닙니다: ${storyId}`);
      const userId = story.user_id;

      const [profile, people, quiz] = await Promise.all([
        db
          .from('profiles')
          .select('display_name, tone, preferred_voice_id, likes, dislikes')
          .eq('id', userId)
          .single(),
        db.from('people').select('name, relation').eq('user_id', userId),
        db.from('quiz_answers').select('question_key, answer').eq('user_id', userId),
      ]);
      if (profile.error) throw profile.error;
      if (people.error) throw people.error;
      if (quiz.error) throw quiz.error;

      return {
        storyId,
        userId,
        dream: story.desires?.text ?? '',
        displayName: profile.data.display_name,
        profileTone: asTone(profile.data.tone),
        preferredVoiceId: profile.data.preferred_voice_id,
        likes: profile.data.likes,
        dislikes: profile.data.dislikes,
        people: people.data,
        quiz: collectQuizAnswers(quiz.data),
      };
    },

    async setStatus(storyId, status, errorCode) {
      const { error } = await db
        .from('stories')
        .update({ status, ...(errorCode !== undefined && { error_code: errorCode }) })
        .eq('id', storyId);
      if (error) throw error;
    },

    async getStatus(storyId) {
      const { data, error } = await db.from('stories').select('status').eq('id', storyId).single();
      if (error) throw error;
      return data.status as StoryStatus;
    },

    async saveText(storyId, { scenePlan, script, promptVersion }) {
      const { error } = await db
        .from('stories')
        .update({
          status: 'text_ready',
          title: scenePlan.title,
          scene_plan: scenePlan,
          script,
          script_chars: script.length,
          prompt_version: promptVersion,
        })
        .eq('id', storyId);
      if (error) throw error;
    },

    async recordCall({ userId, storyId, step, usage, startedAt, finishedAt }) {
      const { error } = await db.from('generation_jobs').insert({
        user_id: userId,
        story_id: storyId,
        kind: jobKind(userId),
        step,
        status: 'succeeded',
        attempts: 1,
        provider: usage.provider,
        model: usage.model,
        input_tokens: usage.inputTokens ?? null,
        output_tokens: usage.outputTokens ?? null,
        tts_chars: usage.ttsChars ?? null,
        est_cost_usd: usage.estCostUsd,
        started_at: startedAt,
        finished_at: finishedAt,
      });
      if (error) throw error;
    },

    async updateStoryJob(storyId, step, status, errorMessage) {
      const now = new Date().toISOString();
      const { error } = await db
        .from('generation_jobs')
        .update({
          step,
          status,
          error: errorMessage ?? null,
          ...(status === 'running' ? { started_at: now } : { finished_at: now }),
        })
        .eq('story_id', storyId)
        .in('kind', ['story', 'library'])
        .is('provider', null);
      if (error) throw error;
    },

    async reuseAudio(storyId, userId, contentHash) {
      const { data: hit, error } = await db
        .from('story_assets')
        .select('storage_path, mime, bytes, duration_sec, provider, model')
        .eq('content_hash', contentHash)
        .eq('type', 'audio')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!hit) return false;

      const assetId = crypto.randomUUID();
      const path = audioPath(userId, storyId, assetId, extFor(hit.mime));
      const { error: copyError } = await db.storage
        .from('story-audio')
        .copy(hit.storage_path, path);
      if (copyError) throw copyError;
      const { error: insertError } = await db.from('story_assets').insert({
        id: assetId,
        story_id: storyId,
        type: 'audio',
        storage_path: path,
        mime: hit.mime,
        bytes: hit.bytes,
        duration_sec: hit.duration_sec,
        content_hash: contentHash,
        provider: hit.provider,
        model: hit.model,
      });
      if (insertError) throw insertError;
      return true;
    },

    async saveAudio({ userId, storyId, bytes, mime, durationSec, contentHash, provider, model }) {
      const assetId = crypto.randomUUID();
      const path = audioPath(userId, storyId, assetId, extFor(mime));
      const { error: uploadError } = await db.storage
        .from('story-audio')
        .upload(path, bytes, { contentType: mime, upsert: false });
      if (uploadError) throw uploadError;
      const { error } = await db.from('story_assets').insert({
        id: assetId,
        story_id: storyId,
        type: 'audio',
        storage_path: path,
        mime,
        bytes: bytes.byteLength,
        duration_sec: Math.round(durationSec * 10) / 10,
        content_hash: contentHash,
        provider,
        model,
      });
      if (error) throw error;
    },

    async resolveVoiceId(voiceKey, preferredVoiceId) {
      if (voiceKey) {
        const { data } = await db.from('voices').select('id').eq('key', voiceKey).maybeSingle();
        if (data) return data.id;
      }
      return preferredVoiceId;
    },
  };
}
