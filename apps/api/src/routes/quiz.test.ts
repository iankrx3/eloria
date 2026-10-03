import { apiErrorResponseSchema, quizCompleteResponseSchema } from '@eloria/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { createFakeQuizRepo, sign, verifyToken } from '../test/fakes';

let fake: ReturnType<typeof createFakeQuizRepo>;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  fake = createFakeQuizRepo();
  app = createApp({ verifyToken, quizRepo: fake.repo });
});

async function post(path: string, userId: string, body?: unknown) {
  const token = await sign({ sub: userId });
  return app.request(path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('POST /v1/quiz/answers', () => {
  it('형식에 맞는 답을 토큰의 사용자로 저장한다', async () => {
    const res = await post('/v1/quiz/answers', 'user-1', { questionKey: 'tone', answer: 'calm' });
    expect(res.status).toBe(204);
    expect(fake.answers.get('user-1')?.get('tone')).toBe('calm');
  });

  it('형식이 틀린 답은 VALIDATION_FAILED로 거부하고 저장하지 않는다', async () => {
    const res = await post('/v1/quiz/answers', 'user-1', {
      questionKey: 'future_self',
      answer: ['kind', 'free', 'relaxed', 'confident'],
    });
    expect(res.status).toBe(400);
    expect(apiErrorResponseSchema.parse(await res.json()).error.code).toBe('VALIDATION_FAILED');
    expect(fake.answers.get('user-1')).toBeUndefined();
  });

  it('JSON이 아닌 본문도 VALIDATION_FAILED', async () => {
    const token = await sign({ sub: 'user-1' });
    const res = await app.request('/v1/quiz/answers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: '{not json',
    });
    expect(res.status).toBe(400);
  });

  it('토큰 없이는 저장할 수 없다', async () => {
    const res = await app.request('/v1/quiz/answers', {
      method: 'POST',
      body: JSON.stringify({ questionKey: 'tone', answer: 'calm' }),
    });
    expect(res.status).toBe(401);
  });
});

describe('POST /v1/quiz/complete', () => {
  it('본인 답변만으로 프로필과 소중한 사람을 반영한다', async () => {
    await post('/v1/quiz/answers', 'user-1', { questionKey: 'name', answer: '서아' });
    await post('/v1/quiz/answers', 'user-1', { questionKey: 'listen_time', answer: 'morning' });
    await post('/v1/quiz/answers', 'user-1', {
      questionKey: 'people',
      answer: [{ name: '민준', relation: 'partner' }],
    });
    await post('/v1/quiz/answers', 'user-2', { questionKey: 'name', answer: '다른 사람' });

    const res = await post('/v1/quiz/complete', 'user-1');
    expect(res.status).toBe(200);
    const { profile } = quizCompleteResponseSchema.parse(await res.json());
    expect(profile).toMatchObject({
      displayName: '서아',
      listenTime: 'morning',
      notifyAt: '07:30',
    });
    expect(fake.people.get('user-1')).toEqual([{ name: '민준', relation: 'partner' }]);
  });
});
