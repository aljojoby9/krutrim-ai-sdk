import {
  InvalidResponseDataError,
  type LanguageModelV3,
  type LanguageModelV3CallOptions,
  type LanguageModelV3Content,
  type LanguageModelV3FinishReason,
  type LanguageModelV3StreamPart,
  type SharedV3Warning,
} from '@ai-sdk/provider';
import {
  combineHeaders,
  createEventSourceResponseHandler,
  createJsonResponseHandler,
  generateId,
  isParsableJson,
  type ParseResult,
  parseProviderOptions,
  postJsonToApi,
} from '@ai-sdk/provider-utils';
import type { z } from 'zod';
import type { KrutrimConfig } from '../config';
import { krutrimFailedResponseHandler } from '../error';
import { resolveModelId } from '../models';
import { convertToChatMessages } from './convert-to-chat-messages';
import { prepareTools } from './prepare-tools';
import {
  type ChatModelId,
  type ChatSettings,
  chatChunkSchema,
  chatResponseSchema,
  chatSettingsSchema,
} from './settings';
import { getResponseMetadata, mapFinishReason } from './utils';

export class KrutrimChatLanguageModel implements LanguageModelV3 {
  readonly specificationVersion = 'v3';

  readonly modelId: string;
  readonly settings: ChatSettings;

  private readonly config: KrutrimConfig;
  private readonly resolvedModelId: string;

  constructor(
    modelId: ChatModelId,
    settings: ChatSettings,
    config: KrutrimConfig,
  ) {
    this.modelId = modelId;
    this.resolvedModelId = resolveModelId(String(modelId));
    this.settings = settings;
    this.config = config;
  }

  get provider(): string {
    return this.config.provider;
  }

  get supportedUrls(): Record<string, RegExp[]> {
    // Vision models may accept HTTPS image URLs via image_url parts.
    return {
      'image/*': [/^https?:\/\/.+/i],
    };
  }

  private async getArgs(
    options: LanguageModelV3CallOptions & { stream: boolean },
  ) {
    const {
      prompt,
      maxOutputTokens,
      temperature,
      topP,
      topK,
      frequencyPenalty,
      presencePenalty,
      stopSequences,
      responseFormat,
      seed,
      tools,
      toolChoice,
      providerOptions,
      stream,
    } = options;

    const warnings: SharedV3Warning[] = [];

    if (topK != null) {
      warnings.push({ type: 'unsupported', feature: 'topK' });
    }

    const krutrimOptions = await parseProviderOptions({
      provider: 'krutrim',
      providerOptions: {
        krutrim: {
          ...providerOptions?.krutrim,
          ...this.settings,
        },
      },
      schema: chatSettingsSchema,
    });

    const reasoningEffort =
      krutrimOptions?.reasoningEffort ?? krutrimOptions?.reasoning_effort;

    const baseArgs: Record<string, unknown> = {
      model: this.resolvedModelId,
      messages: convertToChatMessages(prompt),
      max_tokens: maxOutputTokens,
      temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      stop: stopSequences,
      seed,
      n: krutrimOptions?.n ?? undefined,
      user: krutrimOptions?.user ?? undefined,
      response_format:
        stream === false && responseFormat?.type === 'json'
          ? responseFormat.schema
            ? {
                type: 'json_schema',
                json_schema: {
                  name: responseFormat.name ?? 'response',
                  description: responseFormat.description,
                  schema: responseFormat.schema,
                  strict: true,
                },
              }
            : { type: 'json_object' }
          : undefined,
    };

    if (reasoningEffort) {
      baseArgs.reasoning_effort = reasoningEffort;
    }

    let toolsArg: ReturnType<typeof prepareTools> | null = null;

    if (tools && tools.length > 0) {
      toolsArg = prepareTools({ tools, toolChoice });
    }

    // Fallback for providers without json_schema: force a single function tool.
    if (responseFormat?.type === 'json' && responseFormat.schema) {
      // Prefer native json_schema above; only use tool fallback if needed later.
      // Keep tools path available when tools were also requested.
      if (toolsArg == null && stream === false) {
        // leave json_schema in place — most OpenAI-compatible stacks support it
      }
    }

    return {
      args: {
        ...baseArgs,
        ...(toolsArg
          ? {
              tools: toolsArg.tools,
              tool_choice: toolsArg.tool_choice,
            }
          : {}),
      },
      warnings: [...warnings, ...(toolsArg?.toolWarnings ?? [])],
    };
  }

  async doGenerate(
    options: LanguageModelV3CallOptions,
  ): Promise<Awaited<ReturnType<LanguageModelV3['doGenerate']>>> {
    const { args, warnings } = await this.getArgs({
      ...options,
      stream: false,
    });

    const {
      responseHeaders,
      value: response,
      rawValue: rawResponse,
    } = await postJsonToApi({
      url: this.config.url({
        path: '/chat/completions',
        modelId: this.resolvedModelId,
      }),
      headers: combineHeaders(this.config.headers(), options.headers),
      body: args,
      failedResponseHandler: krutrimFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(chatResponseSchema),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    const choice = response.choices[0];

    if (!choice) {
      throw new InvalidResponseDataError({
        data: response,
        message: 'No choices returned in Krutrim chat completion response',
      });
    }

    const content: LanguageModelV3Content[] = [];

    if (choice.message.content) {
      content.push({ type: 'text', text: choice.message.content });
    }

    if (choice.message.reasoning_content) {
      content.push({ type: 'reasoning', text: choice.message.reasoning_content });
    }

    if (choice.message.tool_calls?.length) {
      for (const toolCall of choice.message.tool_calls) {
        content.push({
          type: 'tool-call',
          toolCallId: toolCall.id ?? (this.config.generateId ?? generateId)(),
          toolName: toolCall.function.name,
          input: toolCall.function.arguments,
        });
      }
    }

    return {
      content,
      finishReason: {
        unified: mapFinishReason(choice.finish_reason),
        raw: choice.finish_reason ?? undefined,
      },
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
          system_fingerprint: response.system_fingerprint,
          resolvedModelId: this.resolvedModelId,
        },
      },
      warnings,
      request: { body: args },
      response: {
        headers: responseHeaders,
        body: rawResponse,
        id: response.id ?? undefined,
        modelId: response.model ?? undefined,
        timestamp: response.created
          ? new Date(response.created * 1000)
          : undefined,
      },
    };
  }

  async doStream(
    options: LanguageModelV3CallOptions,
  ): Promise<Awaited<ReturnType<LanguageModelV3['doStream']>>> {
    const { args, warnings } = await this.getArgs({ ...options, stream: true });

    const { responseHeaders, value: response } = await postJsonToApi({
      url: this.config.url({
        path: '/chat/completions',
        modelId: this.resolvedModelId,
      }),
      headers: combineHeaders(this.config.headers(), options.headers),
      body: { ...args, stream: true },
      failedResponseHandler: krutrimFailedResponseHandler,
      successfulResponseHandler: createEventSourceResponseHandler(chatChunkSchema),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    const toolCalls: Array<{
      id: string;
      name: string;
      arguments: string;
      hasFinished: boolean;
    }> = [];

    let finishReason: LanguageModelV3FinishReason = {
      unified: 'other',
      raw: undefined,
    };
    let usage: {
      inputTokens: {
        total: number | undefined;
        noCache: number | undefined;
        cacheRead: number | undefined;
        cacheWrite: number | undefined;
      };
      outputTokens: {
        total: number | undefined;
        text: number | undefined;
        reasoning: number | undefined;
      };
    } = {
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
    };
    let isFirstChunk = true;
    let textStarted = false;
    let reasoningStarted = false;
    const self = this;

    return {
      stream: response.pipeThrough(
        new TransformStream<
          ParseResult<z.infer<typeof chatChunkSchema>>,
          LanguageModelV3StreamPart
        >({
          start(controller) {
            controller.enqueue({ type: 'stream-start', warnings });
          },
          transform(chunk, controller) {
            if (!chunk.success) {
              finishReason = { unified: 'error', raw: undefined };
              controller.enqueue({ type: 'error', error: chunk.error });
              return;
            }

            const value = chunk.value;

            if ('error' in value && value.error != null && !('choices' in value)) {
              finishReason = { unified: 'error', raw: undefined };
              controller.enqueue({ type: 'error', error: value.error });
              return;
            }

            if (!('choices' in value)) {
              return;
            }

            if (isFirstChunk) {
              isFirstChunk = false;
              const metadata = getResponseMetadata(value);
              if (metadata.id || metadata.timestamp || metadata.modelId) {
                controller.enqueue({ type: 'response-metadata', ...metadata });
              }
            }

            if (value.usage != null) {
              usage = {
                inputTokens: {
                  total: value.usage.prompt_tokens ?? undefined,
                  noCache: undefined,
                  cacheRead: undefined,
                  cacheWrite: undefined,
                },
                outputTokens: {
                  total: value.usage.completion_tokens ?? undefined,
                  text: undefined,
                  reasoning: undefined,
                },
              };
            }

            const choice = value.choices[0];
            if (choice?.finish_reason != null) {
              finishReason = {
                unified: mapFinishReason(choice.finish_reason),
                raw: choice.finish_reason,
              };
            }

            if (choice?.delta == null) {
              return;
            }

            const delta = choice.delta;
            const reasoningText = delta.reasoning ?? delta.reasoning_content;

            if (reasoningText != null && reasoningText.length > 0) {
              if (!reasoningStarted) {
                reasoningStarted = true;
                controller.enqueue({
                  type: 'reasoning-start',
                  id: 'reasoning-0',
                });
              }
              controller.enqueue({
                type: 'reasoning-delta',
                id: 'reasoning-0',
                delta: reasoningText,
              });
            }

            if (delta.content != null && delta.content.length > 0) {
              if (!textStarted) {
                textStarted = true;
                controller.enqueue({ type: 'text-start', id: 'text-0' });
              }
              controller.enqueue({
                type: 'text-delta',
                id: 'text-0',
                delta: delta.content,
              });
            }

            if (delta.tool_calls != null) {
              for (const toolCallDelta of delta.tool_calls) {
                const index = toolCallDelta.index;

                if (toolCalls[index] == null) {
                  if (toolCallDelta.id == null) {
                    throw new InvalidResponseDataError({
                      data: toolCallDelta,
                      message: `Expected tool call 'id' to be a string.`,
                    });
                  }
                  if (toolCallDelta.function?.name == null) {
                    throw new InvalidResponseDataError({
                      data: toolCallDelta,
                      message: `Expected tool call 'function.name' to be a string.`,
                    });
                  }

                  toolCalls[index] = {
                    id: toolCallDelta.id,
                    name: toolCallDelta.function.name,
                    arguments: toolCallDelta.function.arguments ?? '',
                    hasFinished: false,
                  };

                  const toolCall = toolCalls[index];
                  controller.enqueue({
                    type: 'tool-input-start',
                    id: toolCall.id,
                    toolName: toolCall.name,
                  });

                  if (toolCall.arguments.length > 0) {
                    controller.enqueue({
                      type: 'tool-input-delta',
                      id: toolCall.id,
                      delta: toolCall.arguments,
                    });
                  }

                  if (isParsableJson(toolCall.arguments)) {
                    controller.enqueue({
                      type: 'tool-input-end',
                      id: toolCall.id,
                    });
                    controller.enqueue({
                      type: 'tool-call',
                      toolCallId: toolCall.id,
                      toolName: toolCall.name,
                      input: toolCall.arguments,
                    });
                    toolCall.hasFinished = true;
                  }
                  continue;
                }

                const toolCall = toolCalls[index];
                if (toolCall.hasFinished) continue;

                if (toolCallDelta.function?.arguments != null) {
                  toolCall.arguments += toolCallDelta.function.arguments;
                  controller.enqueue({
                    type: 'tool-input-delta',
                    id: toolCall.id,
                    delta: toolCallDelta.function.arguments,
                  });
                }

                if (
                  toolCall.name != null &&
                  toolCall.arguments != null &&
                  isParsableJson(toolCall.arguments)
                ) {
                  controller.enqueue({
                    type: 'tool-input-end',
                    id: toolCall.id,
                  });
                  controller.enqueue({
                    type: 'tool-call',
                    toolCallId: toolCall.id,
                    toolName: toolCall.name,
                    input: toolCall.arguments,
                  });
                  toolCall.hasFinished = true;
                }
              }
            }
          },
          flush(controller) {
            if (reasoningStarted) {
              controller.enqueue({ type: 'reasoning-end', id: 'reasoning-0' });
            }
            if (textStarted) {
              controller.enqueue({ type: 'text-end', id: 'text-0' });
            }
            controller.enqueue({
              type: 'finish',
              finishReason,
              usage,
              providerMetadata: {
                krutrim: {
                  resolvedModelId: self.resolvedModelId,
                },
              },
            });
          },
        }),
      ),
      request: { body: args },
      response: { headers: responseHeaders },
    };
  }
}
