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
  type BhashikLanguageCode,
  type IndicLanguageCode,
  toBhashikLanguageCode,
} from '../indic/languages';
import { extractUserText } from './extract-user-text';

const sentimentResponseSchema = z.object({
  status: z.string().nullish(),
  Sentiment: z
    .array(
      z.object({
        label: z.string().nullish(),
        value: z.array(z.string()).nullish(),
      }),
    )
    .nullish(),
});

export type SentimentSettings = {
  /**
   * Input language (BCP-47 or Bhashik short code).
   * @default "eng"
   */
  language?: IndicLanguageCode | BhashikLanguageCode | string;
};

/**
 * Bhashik sentiment analysis as LanguageModelV3 (`generateText`).
 * Returns a compact text summary of sentiment labels.
 */
export class KrutrimSentimentModel implements LanguageModelV3 {
  readonly specificationVersion = 'v3';
  readonly modelId = 'bhashik-sentiment';
  readonly provider: string;

  private readonly settings: SentimentSettings;
  private readonly config: KrutrimConfig;

  constructor(settings: SentimentSettings = {}, config: KrutrimConfig) {
    this.settings = settings;
    this.config = config;
    this.provider = config.provider;
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
        'Sentiment analysis requires a non-empty user prompt or message.',
      );
    }

    const lang =
      toBhashikLanguageCode(this.settings.language ?? 'eng') ??
      this.settings.language ??
      'eng';

    const body = {
      text,
      lang_from: lang,
    };

    const {
      responseHeaders,
      value: response,
      rawValue,
    } = await postJsonToApi({
      url: this.config.languageLabsUrl('/languagelabs/sentiment-analysis'),
      headers: combineHeaders(this.config.headers(), options.headers),
      body,
      failedResponseHandler: krutrimFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        sentimentResponseSchema,
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    const labels =
      response.Sentiment?.flatMap((s) => s.value ?? (s.label ? [s.label] : [])) ??
      [];
    const out = labels.length > 0 ? labels.join(', ') : 'unknown';

    const content: LanguageModelV3Content[] = [{ type: 'text', text: out }];

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
          Sentiment: response.Sentiment ?? [],
        },
      },
      warnings: [
        {
          type: 'other',
          message:
            'sentiment only processes prompt / user messages (not system or assistant).',
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
