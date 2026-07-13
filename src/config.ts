import type { FetchFunction } from '@ai-sdk/provider-utils';

/**
 * Default OpenAI-compatible base URL for Krutrim Cloud chat, embeddings, etc.
 * @see https://docs.cloud.olakrutrim.com/basics/ai-studio/ai-jobs/inferencing
 */
export const KRUTRIM_DEFAULT_BASE_URL = 'https://cloud.olakrutrim.com/v1';

/**
 * Base host used for Language Labs / Bhashik endpoints
 * (`/api/v1/languagelabs/*`).
 */
export const KRUTRIM_DEFAULT_API_HOST = 'https://cloud.olakrutrim.com';

/**
 * Internal configuration shared by model implementations.
 */
export type KrutrimConfig = {
  provider: string;
  /**
   * Build a full request URL for the OpenAI-compatible API.
   */
  url: (options: { modelId: string; path: string }) => string;
  /**
   * Build a full request URL for Language Labs endpoints.
   */
  languageLabsUrl: (path: string) => string;
  headers: () => Record<string, string | undefined>;
  fetch?: FetchFunction;
  generateId?: () => string;
};

/**
 * Options for {@link createKrutrim}.
 */
export interface KrutrimProviderSettings {
  /**
   * Base URL for OpenAI-compatible API calls (`/chat/completions`, `/embeddings`).
   * @default "https://cloud.olakrutrim.com/v1"
   */
  baseURL?: string;

  /**
   * Root host for Language Labs / Bhashik endpoints.
   * @default "https://cloud.olakrutrim.com"
   */
  apiHost?: string;

  /**
   * API key for authenticating requests.
   * Defaults to `process.env.KRUTRIM_API_KEY` or
   * `process.env.KRUTRIM_CLOUD_API_KEY`.
   */
  apiKey?: string;

  /**
   * Custom headers merged into every request (can override defaults).
   */
  headers?: Record<string, string>;

  /**
   * Custom `fetch` implementation for middleware, testing, or edge runtimes.
   */
  fetch?: FetchFunction;

  /**
   * Optional ID generator used for tool call IDs when the API omits them.
   */
  generateId?: () => string;
}

/**
 * Resolve the Krutrim API key from options or environment variables.
 *
 * Checks (in order):
 * 1. Explicit `apiKey` option
 * 2. `KRUTRIM_API_KEY`
 * 3. `KRUTRIM_CLOUD_API_KEY` (official Krutrim Cloud SDK name)
 */
export function resolveKrutrimApiKey(
  apiKey: string | undefined,
): string | undefined {
  if (apiKey && apiKey.trim().length > 0) {
    return apiKey;
  }

  if (typeof process === 'undefined' || !process.env) {
    return undefined;
  }

  return (
    process.env.KRUTRIM_API_KEY?.trim() ||
    process.env.KRUTRIM_CLOUD_API_KEY?.trim() ||
    undefined
  );
}
