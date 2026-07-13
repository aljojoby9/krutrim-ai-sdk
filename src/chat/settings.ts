import { z } from 'zod';
import type { ChatModelId } from '../models';
import { krutrimErrorDataSchema } from '../error';

export type { ChatModelId };

/**
 * Optional provider-side chat settings (also via `providerOptions.krutrim`).
 */
export type ChatSettings = {
  /**
   * How many chat completion choices to generate per input message.
   * You are billed for all generated tokens — keep `n` at `1` when possible.
   */
  n?: number;

  /**
   * Unique end-user identifier for abuse monitoring (OpenAI-compatible `user`).
   */
  user?: string;

  /**
   * Reasoning effort for reasoning models (provider-dependent).
   */
  reasoningEffort?: 'low' | 'medium' | 'high';
};

export const chatSettingsSchema = z.object({
  n: z.number().min(1).max(128).nullish(),
  user: z.string().nullish(),
  reasoningEffort: z.enum(['low', 'medium', 'high']).nullish(),
  // snake_case passthrough for raw API fields if set via providerOptions
  reasoning_effort: z.enum(['low', 'medium', 'high']).nullish(),
});

export const chatResponseSchema = z.object({
  id: z.string().nullish(),
  created: z.number().nullish(),
  model: z.string().nullish(),
  object: z.string().nullish(),
  system_fingerprint: z.string().nullish(),
  choices: z.array(
    z.object({
      index: z.number(),
      finish_reason: z.string().nullish(),
      logprobs: z.object({}).nullish(),
      message: z.object({
        content: z.string().nullish(),
        reasoning_content: z.string().nullish(),
        refusal: z.string().nullish(),
        role: z.string().nullish(),
        tool_calls: z
          .array(
            z.object({
              id: z.string().nullish(),
              type: z.literal('function'),
              function: z.object({
                name: z.string(),
                arguments: z.string(),
              }),
            }),
          )
          .nullish(),
      }),
    }),
  ),
  usage: z
    .object({
      completion_tokens: z.number().nullish(),
      prompt_tokens: z.number().nullish(),
      total_tokens: z.number().nullish(),
    })
    .nullish(),
});

export const chatChunkSchema = z.union([
  z.object({
    id: z.string().nullish(),
    created: z.number().nullish(),
    model: z.string().nullish(),
    choices: z.array(
      z.object({
        delta: z
          .object({
            content: z.string().nullish(),
            reasoning: z.string().nullish(),
            reasoning_content: z.string().nullish(),
            role: z.string().nullish(),
            tool_calls: z
              .array(
                z.object({
                  index: z.number(),
                  id: z.string().nullish(),
                  type: z.literal('function').optional(),
                  function: z.object({
                    name: z.string().nullish(),
                    arguments: z.string().nullish(),
                  }),
                }),
              )
              .nullish(),
          })
          .nullish(),
        finish_reason: z.string().nullable().optional(),
        index: z.number(),
      }),
    ),
    usage: z
      .object({
        prompt_tokens: z.number().nullish(),
        completion_tokens: z.number().nullish(),
        total_tokens: z.number().nullish(),
      })
      .nullish(),
  }),
  krutrimErrorDataSchema,
]);
