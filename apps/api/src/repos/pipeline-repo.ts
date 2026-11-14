import {
  collectQuizAnswers,
  fallbackArinStoryJson,
  recentLineFromStory,
  visionSchema,
  type ArinStory,
  type ImageHint,
  type Vision,
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
  /** on_demand·daily·library. 데일리는 짧게 만든다. */
  kind: 'on_demand' | 'daily' | 'library';
  /** 비전 고르기(H05)에서 고른 장면 */
  vision: Vision | null;
  /** 이야기 수정 요청. 있으면 직접 소원 한도에 들고 JSON 한 편으로 다시 쓴다. */
  revisionRequest: string | null;
  /** 수정 대상의 기존 본문. 새 이야기면 null. */
  previousScript: string | null;
  /** 수정에 다시 넣을 이전 이야기 JSON. 새 이야기면 null. */
  previousStory: unknown | null;
  /** 최근 3편의 제목·따옴표 대사·마지막 확언. 첫 이야기면 빈 배열. */
  recentLines: string[];
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
    text: {
      scenePlan: ScenePlan | null;
      script: string;
      promptVersion: string;
      title?: string;
      imageHint?: ImageHint | null;
      affirmations?: string[] | null;
      arinStory?: ArinStory | null;
    },
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
  /** 고른 보이스(key) → 프로필 기본 보이스 순. voices 행의 공급자 보이스 ID를 돌려준다. */
  resolveVoice(
    voiceKey: string | undefined,
    preferredVoiceId: string | null,
  ): Promise<{ id: string; providerVoiceId: string } | null>;
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
    kind: 'library',
    vision: null,
    revisionRequest: null,
    previousScript: null,
    previousStory: null,
    recentLines: [],
  };
}

export function createSupabasePipelineRepo(db: AdminClient): PipelineRepo {
  return {
    async loadContext(storyId) {
      const { data: story, error } = await db
        .from('stories')
        .select(
          'id, user_id, kind, vision, revision_request, parent_story_id, desires(text), library_items(theme, tone)',
        )
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

      const recent = await db
        .from('stories')
        .select('title, script, affirmations')
        .eq('user_id', userId)
        .neq('id', storyId)
        .in('status', ['text_ready', 'audio_ready', 'ready'])
        .order('created_at', { ascending: false })
        .limit(3);
      if (recent.error) throw recent.error;

      let previousScript: string | null = null;
      let previousStory: unknown | null = null;
      if (story.parent_story_id) {
        const parent = await db
          .from('stories')
          .select('script, arin_story, title, image_hint, affirmations')
          .eq('id', story.parent_story_id)
          .maybeSingle();
        if (parent.error) throw parent.error;
        previousScript = parent.data?.script ?? null;
        if (parent.data) {
          const saved = parent.data.arin_story;
          const affirmations = Array.isArray(parent.data.affirmations)
            ? parent.data.affirmations.filter((line): line is string => typeof line === 'string')
            : null;
          previousStory =
            saved && typeof saved === 'object' && !Array.isArray(saved)
              ? saved
              : fallbackArinStoryJson({
                  title: parent.data.title,
                  script: parent.data.script,
                  imageHint: parent.data.image_hint,
                  affirmations,
                });
        }
      }

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
        kind: story.kind === 'daily' ? 'daily' : 'on_demand',
        // JSON 컬럼은 zod로 검증한다(CLAUDE.md). 형식이 틀리면 장면 없이 만든다.
        vision: story.vision ? (visionSchema.safeParse(story.vision).data ?? null) : null,
        revisionRequest: story.revision_request,
        previousScript,
        previousStory,
        recentLines: (recent.data ?? []).map((row) =>
          recentLineFromStory({
            title: row.title,
            script: row.script,
            affirmations: Array.isArray(row.affirmations)
              ? row.affirmations.filter((line): line is string => typeof line === 'string')
              : null,
          }),
        ),
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

    async saveText(
      storyId,
      { scenePlan, script, promptVersion, title, imageHint, affirmations, arinStory },
    ) {
      // 라이브러리 카드처럼 미리 정한 제목(Figma 문구)이 있으면 생성 제목으로 덮지 않는다.
      const { data: current, error: readError } = await db
        .from('stories')
        .select('title')
        .eq('id', storyId)
        .single();
      if (readError) throw readError;
      const { error } = await db
        .from('stories')
        .update({
          status: 'text_ready',
          title: current.title ?? title ?? scenePlan?.title ?? null,
          scene_plan: scenePlan,
          script,
          script_chars: script.length,
          prompt_version: promptVersion,
          ...(imageHint !== undefined && { image_hint: imageHint }),
          ...(affirmations !== undefined && { affirmations }),
          ...(arinStory !== undefined && { arin_story: arinStory }),
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
        .in('kind', ['story', 'daily', 'library'])
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

    async resolveVoice(voiceKey, preferredVoiceId) {
      const pick = async (column: 'key' | 'id', value: string) => {
        const { data, error } = await db
          .from('voices')
          .select('id, provider_voice_id')
          .eq(column, value)
          .eq('is_active', true)
          .maybeSingle();
        if (error) throw error;
        return data && { id: data.id, providerVoiceId: data.provider_voice_id };
      };
      return (
        (voiceKey ? await pick('key', voiceKey) : null) ??
        (preferredVoiceId ? await pick('id', preferredVoiceId) : null)
      );
    },
  };
}
