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
import { extractUserText } from './extract-user-text';

const lidResponseSchema = z.object({
  status: z.string().nullish(),
  data: z
    .array(
      z.object({
        label: z.string().nullish(),
        value: z.string().nullish(),
      }),
    )
    .nullish(),
});

/**
 * Language detection via Bhashik (`/api/v1/languagelabs/language-detection`).
 * Implements LanguageModelV3 so it works with `generateText`.
 */
export class KrutrimLanguageDetectionModel implements LanguageModelV3 {
  readonly specificationVersion = 'v3';
  readonly modelId = 'bhashik-language-detection';
  readonly provider: string;

  private readonly config: KrutrimConfig;

  constructor(config: KrutrimConfig) {
    this.config = config;
    this.provider = config.provider;
  }

  get supportedUrls(): Record<string, RegExp[]> {
    return {};
  }

  async doGenerate(
    options: LanguageModelV3CallOptions,
  ): Promise<Awaited<ReturnType<LanguageModelV3['doGenerate']>>> {
    const query = extractUserText(options);
    if (!query.trim()) {
      throw new Error(
        'Language detection requires a non-empty user prompt or message.',
      );
    }

    const {
      responseHeaders,
      value: response,
      rawValue,
    } = await postJsonToApi({
      url: this.config.languageLabsUrl('/languagelabs/language-detection'),
      headers: combineHeaders(this.config.headers(), options.headers),
      body: { query },
      failedResponseHandler: krutrimFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(lidResponseSchema),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    // Prefer primary language label/value
    const primary = response.data?.[0];
    const text =
      primary?.value ??
      primary?.label ??
      response.data?.map((d) => d.value ?? d.label).filter(Boolean).join(', ') ??
      'unknown';

    const content: LanguageModelV3Content[] = [{ type: 'text', text }];

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
          detections: response.data ?? [],
        },
      },
      warnings: [
        {
          type: 'other',
          message:
            'languageDetection only analyzes prompt / user messages (not system or assistant).',
        },
      ],
      request: { body: { query } },
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
    const text =
      result.content.find((c) => c.type === 'text')?.type === 'text'
        ? (result.content.find((c) => c.type === 'text') as { text: string })
            .text
        : '';

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
