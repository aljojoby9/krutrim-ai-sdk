import {
  type LanguageModelV3,
  type LanguageModelV3CallOptions,
  type LanguageModelV3Content,
} from '@ai-sdk/provider';
import {
  combineHeaders,
  createJsonResponseHandler,
  postJsonToApi,
} from '@ai-sdk/provider-utils';
import type { KrutrimConfig } from '../config';
import { krutrimFailedResponseHandler } from '../error';
import { chatResponseSchema } from '../chat/settings';
import { INDIC_LANGUAGES, type IndicLanguageCode } from '../indic/languages';
import { resolveModelId } from '../models';
import { extractUserText } from './extract-user-text';

/**
 * Transliterate settings (Sarvam-compatible surface).
 *
 * Krutrim Cloud does not expose a dedicated `/transliterate` endpoint today.
 * This model uses chat completions with a strict system prompt so the DX
 * matches `sarvam.transliterate(...)`.
 */
export type TransliterateSettings = {
  /**
   * Target language for the script (e.g. `hi-IN` → Devanagari).
   */
  to: IndicLanguageCode | string;
  /**
   * Source language. Use `"auto"` or omit to detect.
   * @default "auto"
   */
  from?: IndicLanguageCode | string | 'auto';
  /**
   * Chat model used for transliteration.
   * @default "Krutrim-2"
   */
  model?: string;
  /**
   * Prefer native script numerals when true (language-dependent).
   * @default false
   */
  nativeNumerals?: boolean;
};

function languageLabel(code: string): string {
  const entry = INDIC_LANGUAGES.find(
    (l) => l.code === code || l.bhashik === code,
  );
  if (entry) {
    return `${entry.name} (${entry.nativeName}), script: ${entry.script}`;
  }
  return code;
}

function buildSystemPrompt(settings: TransliterateSettings): string {
  const to = languageLabel(settings.to);
  const from =
    !settings.from || settings.from === 'auto'
      ? 'auto-detect the source (often Romanized / Latin script Indic, e.g. Hinglish)'
      : languageLabel(settings.from);

  return [
    'You are a precise transliteration engine for Indian languages.',
    'Task: convert the user text between scripts / Romanization.',
    `Source: ${from}.`,
    `Target: ${to}.`,
    'Rules:',
    '- Output ONLY the transliterated text. No quotes, labels, or explanations.',
    '- Preserve meaning; do not translate to a different language unless target requires it for script.',
    '- Keep punctuation and line breaks.',
    settings.nativeNumerals
      ? '- Prefer native-script numerals where natural for the target language.'
      : '- Keep Western digits (0-9) unless the source already uses native numerals.',
    '- If input is already in the target script, return it unchanged.',
  ].join('\n');
}

/**
 * Chat-backed transliteration as LanguageModelV3 (works with `generateText`).
 * Only processes prompt / user messages.
 */
export class KrutrimTransliterateModel implements LanguageModelV3 {
  readonly specificationVersion = 'v3';
  readonly modelId: string;
  readonly provider: string;

  private readonly settings: TransliterateSettings;
  private readonly config: KrutrimConfig;
  private readonly resolvedModelId: string;

  constructor(settings: TransliterateSettings, config: KrutrimConfig) {
    if (!settings.to) {
      throw new Error('transliterate() requires a `to` language code (e.g. "hi-IN").');
    }
    this.settings = settings;
    this.config = config;
    this.provider = config.provider;
    this.resolvedModelId = resolveModelId(settings.model ?? 'Krutrim-2');
    this.modelId = `transliterate:${this.resolvedModelId}`;
  }

  get supportedUrls(): Record<string, RegExp[]> {
    return {};
  }

  async doGenerate(
    options: LanguageModelV3CallOptions,
  ): Promise<Awaited<ReturnType<LanguageModelV3['doGenerate']>>> {
    const text = extractUserText(options);
    if (!text.trim()) {
      throw new Error(
        'Transliteration requires a non-empty user prompt or message.',
      );
    }

    const body = {
      model: this.resolvedModelId,
      temperature: 0,
      messages: [
        { role: 'system', content: buildSystemPrompt(this.settings) },
        { role: 'user', content: text },
      ],
    };

    const {
      responseHeaders,
      value: response,
      rawValue,
    } = await postJsonToApi({
      url: this.config.url({
        path: '/chat/completions',
        modelId: this.resolvedModelId,
      }),
      headers: combineHeaders(this.config.headers(), options.headers),
      body,
      failedResponseHandler: krutrimFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(chatResponseSchema),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    const out = response.choices[0]?.message?.content?.trim() ?? '';
    const content: LanguageModelV3Content[] = [{ type: 'text', text: out }];

    return {
      content,
      finishReason: { unified: 'stop', raw: 'stop' },
      usage: {
        inputTokens: {
          total: response.usage?.prompt_tokens ?? undefined,
          noCache: undefined,
          cacheRead: undefined,
          cacheWrite: undefined,
        },
        outputTokens: {
          total: response.usage?.completion_tokens ?? undefined,
          text: undefined,
          reasoning: undefined,
        },
      },
      providerMetadata: {
        krutrim: {
          mode: 'transliterate',
          to: this.settings.to,
          from: this.settings.from ?? 'auto',
          chatModel: this.resolvedModelId,
          note: 'Chat-backed transliteration (no dedicated Bhashik endpoint).',
        },
      },
      warnings: [
        {
          type: 'other',
          message:
            'transliterate only processes prompt / user messages (not system or assistant). Uses chat completions under the hood.',
        },
      ],
      request: { body },
      response: {
        headers: responseHeaders,
        body: rawValue,
        modelId: this.modelId,
        timestamp: new Date(),
      },
    };
  }

  async doStream(
    options: LanguageModelV3CallOptions,
  ): Promise<Awaited<ReturnType<LanguageModelV3['doStream']>>> {
    const result = await this.doGenerate(options);
    const textPart = result.content.find((c) => c.type === 'text');
    const text = textPart && textPart.type === 'text' ? textPart.text : '';

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue({ type: 'stream-start', warnings: result.warnings });
        controller.enqueue({ type: 'text-start', id: 'text-0' });
        controller.enqueue({ type: 'text-delta', id: 'text-0', delta: text });
        controller.enqueue({ type: 'text-end', id: 'text-0' });
        controller.enqueue({
          type: 'finish',
          finishReason: result.finishReason,
          usage: result.usage,
          providerMetadata: result.providerMetadata,
        });
        controller.close();
      },
    });

    return {
      stream,
      request: result.request,
      response: result.response,
    };
  }
}
