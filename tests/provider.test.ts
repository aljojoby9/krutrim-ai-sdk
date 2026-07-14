import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createKrutrim } from '../src/provider';
import { resolveKrutrimApiKey } from '../src/config';

describe('createKrutrim', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, KRUTRIM_API_KEY: 'test-key-123' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('creates a callable provider', () => {
    const provider = createKrutrim({ apiKey: 'test-key-123' });
    const model = provider('Krutrim-2');
    expect(model.specificationVersion).toBe('v3');
    expect(model.provider).toBe('krutrim.chat');
    expect(model.modelId).toBe('Krutrim-2');
  });

  it('supports languageModel and chat aliases', () => {
    const provider = createKrutrim({ apiKey: 'test-key-123' });
    expect(provider.languageModel('krutrim-2').modelId).toBe('krutrim-2');
    expect(provider.chat('Krutrim-1').modelId).toBe('Krutrim-1');
  });

  it('creates embedding models', () => {
    const provider = createKrutrim({ apiKey: 'test-key-123' });
    const emb = provider.embedding('Vyakyarth');
    expect(emb.specificationVersion).toBe('v3');
    expect(emb.provider).toBe('krutrim.embedding');
  });

  it('creates speech and transcription models', () => {
    const provider = createKrutrim({ apiKey: 'test-key-123' });
    const speech = provider.speech('hi-IN', { speaker: 'male' });
    expect(speech.specificationVersion).toBe('v3');
    expect(speech.modelId).toBe('Krutrim-TTS');

    const stt = provider.transcription('ta-IN');
    expect(stt.modelId).toBe('Krutrim-Dhwani');
  });

  it('creates language detection and translation models', () => {
    const provider = createKrutrim({ apiKey: 'test-key-123' });
    expect(provider.languageDetection().modelId).toBe(
      'bhashik-language-detection',
    );
    expect(provider.languageIdentification().modelId).toBe(
      'bhashik-language-detection',
    );
    expect(
      provider.translation({ from: 'hi-IN', to: 'en-IN' }).modelId,
    ).toBe('krutrim-translate-v1.0');
    expect(
      provider.translation('krutrim-translate-v1.0', {
        from: 'hi-IN',
        to: 'en-IN',
      }).modelId,
    ).toBe('krutrim-translate-v1.0');
  });

  it('creates transliterate, summarization, sentiment (Sarvam-style TTT + extras)', () => {
    const provider = createKrutrim({ apiKey: 'test-key-123' });
    expect(provider.transliterate({ to: 'hi-IN' }).modelId).toContain(
      'transliterate',
    );
    expect(provider.summarization({ language: 'hin' }).modelId).toBe(
      'bhashik-summarization',
    );
    expect(provider.sentiment({ language: 'eng' }).modelId).toBe(
      'bhashik-sentiment',
    );
  });

  it('supports Sarvam-style speech(model, language) signature', () => {
    const provider = createKrutrim({ apiKey: 'test-key-123' });
    const s = provider.speech('Krutrim-TTS', 'hi-IN');
    expect(s.modelId).toBe('Krutrim-TTS');
    const t = provider.transcription('Krutrim-Dhwani', 'ta-IN');
    expect(t.modelId).toBe('Krutrim-Dhwani');
  });

  it('rejects new keyword misuse', () => {
    const provider = createKrutrim({ apiKey: 'test-key-123' });
    // languageModel is a regular function; the new.target check is inside
    expect(() => provider('Krutrim-2')).not.toThrow();
  });
});

describe('resolveKrutrimApiKey', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('prefers explicit apiKey', () => {
    process.env = {
      ...originalEnv,
      KRUTRIM_API_KEY: 'env-key',
      KRUTRIM_CLOUD_API_KEY: 'cloud-key',
    };
    expect(resolveKrutrimApiKey('explicit')).toBe('explicit');
  });

  it('falls back to KRUTRIM_API_KEY', () => {
    process.env = {
      ...originalEnv,
      KRUTRIM_API_KEY: 'env-key',
      KRUTRIM_CLOUD_API_KEY: 'cloud-key',
    };
    delete process.env.KRUTRIM_API_KEY;
    // re-set only cloud
    process.env = {
      ...originalEnv,
      KRUTRIM_CLOUD_API_KEY: 'cloud-key',
    };
    delete (process.env as { KRUTRIM_API_KEY?: string }).KRUTRIM_API_KEY;
    expect(resolveKrutrimApiKey(undefined)).toBe('cloud-key');
  });

  it('reads KRUTRIM_API_KEY first when both set', () => {
    process.env = {
      ...originalEnv,
      KRUTRIM_API_KEY: 'short-key',
      KRUTRIM_CLOUD_API_KEY: 'cloud-key',
    };
    expect(resolveKrutrimApiKey(undefined)).toBe('short-key');
  });
});

describe('chat generate with mock fetch', () => {
  it('calls OpenAI-compatible chat completions endpoint', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          id: 'chatcmpl-test',
          created: 1_700_000_000,
          model: 'Krutrim-2',
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: { role: 'assistant', content: 'नमस्ते!' },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15,
          },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    });

    const provider = createKrutrim({
      apiKey: 'test-key-123',
      fetch: fetchMock as unknown as typeof fetch,
    });

    const model = provider('krutrim-2');
    const result = await model.doGenerate({
      prompt: [{ role: 'user', content: [{ type: 'text', text: 'hello' }] }],
    } as never);

    expect(fetchMock).toHaveBeenCalledOnce();
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const [url, init] = call;
    expect(String(url)).toContain('/v1/chat/completions');
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe('Krutrim-2'); // alias resolved
    expect(body.messages[0].content).toBe('hello');

    const textPart = result.content.find((c) => c.type === 'text');
    expect(textPart && textPart.type === 'text' ? textPart.text : '').toBe(
      'नमस्ते!',
    );
    expect(result.finishReason.unified).toBe('stop');
    expect(result.usage.inputTokens?.total).toBe(10);
  });
});
