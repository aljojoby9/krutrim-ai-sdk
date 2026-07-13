import type { EmbeddingModelV3 } from '@ai-sdk/provider';
import {
  combineHeaders,
  createJsonResponseHandler,
  postJsonToApi,
} from '@ai-sdk/provider-utils';
import { z } from 'zod';
import type { KrutrimConfig } from '../config';
import { krutrimFailedResponseHandler } from '../error';
import { resolveModelId, type EmbeddingModelId } from '../models';

const embeddingResponseSchema = z.object({
  object: z.string().nullish(),
  data: z.array(
    z.object({
      object: z.string().nullish(),
      embedding: z.array(z.number()),
      index: z.number(),
    }),
  ),
  model: z.string().nullish(),
  usage: z
    .object({
      prompt_tokens: z.number().nullish(),
      total_tokens: z.number().nullish(),
    })
    .nullish(),
});

/**
 * OpenAI-compatible embedding model for Krutrim (Vyakyarth, Bhasantarit, etc.).
 */
export class KrutrimEmbeddingModel implements EmbeddingModelV3 {
  readonly specificationVersion = 'v3';
  readonly modelId: EmbeddingModelId;
  readonly maxEmbeddingsPerCall = 32;
  readonly supportsParallelCalls = true;

  private readonly config: KrutrimConfig;
  private readonly resolvedModelId: string;

  constructor(modelId: EmbeddingModelId, config: KrutrimConfig) {
    this.modelId = modelId;
    this.resolvedModelId = resolveModelId(modelId);
    this.config = config;
  }

  get provider(): string {
    return this.config.provider;
  }

  async doEmbed({
    values,
    headers,
    abortSignal,
    providerOptions,
  }: Parameters<EmbeddingModelV3['doEmbed']>[0]): Promise<
    Awaited<ReturnType<EmbeddingModelV3['doEmbed']>>
  > {
    const krutrimOptions = providerOptions?.krutrim as
      | { dimensions?: number; user?: string }
      | undefined;

    const {
      responseHeaders,
      value: response,
      rawValue,
    } = await postJsonToApi({
      url: this.config.url({
        path: '/embeddings',
        modelId: this.resolvedModelId,
      }),
      headers: combineHeaders(this.config.headers(), headers),
      body: {
        model: this.resolvedModelId,
        input: values,
        dimensions: krutrimOptions?.dimensions,
        user: krutrimOptions?.user,
      },
      failedResponseHandler: krutrimFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(embeddingResponseSchema),
      abortSignal,
      fetch: this.config.fetch,
    });

    return {
      embeddings: response.data
        .slice()
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding),
      usage: response.usage?.total_tokens
        ? { tokens: response.usage.total_tokens }
        : undefined,
      warnings: [],
      response: { headers: responseHeaders, body: rawValue },
    };
  }
}
