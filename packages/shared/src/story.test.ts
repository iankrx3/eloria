import { describe, expect, it } from 'vitest';
import { manifestRequestSchema } from './api/manifests';
import { canPlayStory, canReadStory } from './story';

describe('manifestRequestSchema', () => {
  it('꿈은 공백을 빼고 1~200자', () => {
    expect(manifestRequestSchema.parse({ text: '  청담동 자가  ' }).text).toBe('청담동 자가');
    expect(manifestRequestSchema.safeParse({ text: '   ' }).success).toBe(false);
    expect(manifestRequestSchema.safeParse({ text: 'x'.repeat(201) }).success).toBe(false);
    expect(manifestRequestSchema.safeParse({ text: 'a', category: 'fame' }).success).toBe(false);
  });
});

describe('canReadStory / canPlayStory', () => {
  it('text_ready부터 읽기, audio_ready부터 재생', () => {
    expect(canReadStory('reviewing')).toBe(false);
    expect(canReadStory('text_ready')).toBe(true);
    expect(canPlayStory('text_ready')).toBe(false);
    expect(canPlayStory('audio_ready')).toBe(true);
    expect(canPlayStory('ready')).toBe(true);
  });
});
