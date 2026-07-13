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
import { z } from 'zod';
import type { KrutrimConfig } from '../config';
import { krutrimFailedResponseHandler } from '../error';
import {
  type IndicLanguageCode,
  toTranslationLanguageCode,
} from '../indic/languages';

const translationResponseSchema = z.object({
  status: z.string().nullish(),
  data: z
    .object({
      translated_text: z.string().nullish(),
    })
    .nullish(),
});

export type TranslationSettings = {
  /**
   * Source language (BCP-47 like `hi-IN`, short `hin`, or `hin_Deva`).
   */
  from: IndicLanguageCode | string;
  /**
   * Target language (BCP-47 like `en-IN`, short `eng`, or `eng_Latn`).
   */
  to: IndicLanguageCode | string;
  /**
   * Translation model.
   * @default "krutrim-translate-v1.0"
   */
  model?: string;
};

function extractUserText(options: LanguageModelV3CallOptions): string {
  const prompt = options.prompt;
  if (!Array.isArray(prompt)) {
    return '';
  }
  const parts: string[] = [];
  for (const message of prompt) {
    if (message.role === 'user') {
      for (const part of message.content) {
        if (part.type === 'text') {
          parts.push(part.text);
        }
      }
    }
  }
  return parts.join('\n');
}

/**
 * Bhashik text translation as a LanguageModelV3 (works with `generateText`).
 * Only translates user/prompt text — not system or assistant messages.
 */
export class KrutrimTranslationModel implements LanguageModelV3 {
  readonly specificationVersion = 'v3';
  readonly modelId: string;
  readonly provider: string;

  private readonly settings: TranslationSettings;
  private readonly config: KrutrimConfig;

  constructor(settings: TranslationSettings, config: KrutrimConfig) {
    this.settings = settings;
    this.config = config;
    this.provider = config.provider;
    this.modelId = settings.model ?? 'krutrim-translate-v1.0';
  }

  get supportedUrls(): Record<string, RegExp[]> {
    return {};
  }

  async doGenerate(
    options: LanguageModelV3CallOptions,
  ): Promise<Awaited<ReturnType<LanguageModelV3['doGenerate']>>> {
    const text = extractUserText(options);
    if (!text.trim()) {
      throw new Error('Translation requires a non-empty user prompt or message.');
    }

    const src = toTranslationLanguageCode(this.settings.from);
    const tgt = toTranslationLanguageCode(this.settings.to);

    const body = {
      text,
      src_language: src,
      tgt_language: tgt,
      model: this.modelId,
    };

    const {
      responseHeaders,
      value: response,
      rawValue,
    } = await postJsonToApi({
      url: this.config.languageLabsUrl('/languagelabs/translation'),
      headers: combineHeaders(this.config.headers(), options.headers),
      body,
      failedResponseHandler: krutrimFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        translationResponseSchema,
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    const translated = response.data?.translated_text ?? '';
    const content: LanguageModelV3Content[] = [
      { type: 'text', text: translated },
    ];

    return {
      content,
      finishReason: { unified: 'stop', raw: 'stop' },
      usage: {
        inputTokens: {
          total: undefined,
          noCache: undefined,
          cacheRead: undefined,
          cacheWrite: undefined,
        },
        outputTokens: {
          total: undefined,
          text: undefined,
          reasoning: undefined,
        },
      },
      providerMetadata: {
        krutrim: {
          src_language: src,
          tgt_language: tgt,
          model: this.modelId,
        },
      },
      warnings: [
        {
          type: 'other',
          message:
            'translation only processes prompt / user messages (not system or assistant).',
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
