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

const summaryResponseSchema = z.object({
  status: z.string().nullish(),
  data: z
    .object({
      summaryText: z.string().nullish(),
    })
    .nullish(),
});

export type SummarizationSettings = {
  /**
   * Input language (BCP-47 or Bhashik short code).
   * @default "eng"
   */
  language?: IndicLanguageCode | BhashikLanguageCode | string;
  /**
   * Target summary size in words.
   * @default 50
   */
  summarySize?: number;
};

function resolveBhashikLang(
  code: string | undefined,
): BhashikLanguageCode | string {
  if (!code) return 'eng';
  return toBhashikLanguageCode(code) ?? code;
}

/**
 * Bhashik summarization as LanguageModelV3 (`generateText`).
 */
export class KrutrimSummarizationModel implements LanguageModelV3 {
  readonly specificationVersion = 'v3';
  readonly modelId = 'bhashik-summarization';
  readonly provider: string;

  private readonly settings: SummarizationSettings;
  private readonly config: KrutrimConfig;

  constructor(settings: SummarizationSettings = {}, config: KrutrimConfig) {
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
      throw new Error('Summarization requires a non-empty user prompt or message.');
    }

    const body = {
      text,
      input_language: resolveBhashikLang(this.settings.language),
      summary_size: this.settings.summarySize ?? 50,
    };

    const {
      responseHeaders,
      value: response,
      rawValue,
    } = await postJsonToApi({
      url: this.config.languageLabsUrl('/languagelabs/summarization'),
      headers: combineHeaders(this.config.headers(), options.headers),
      body,
      failedResponseHandler: krutrimFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(summaryResponseSchema),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    const summary = response.data?.summaryText ?? '';
    const content: LanguageModelV3Content[] = [{ type: 'text', text: summary }];

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
        krutrim: { summary_size: body.summary_size },
      },
      warnings: [
        {
          type: 'other',
          message:
            'summarization only processes prompt / user messages (not system or assistant).',
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
