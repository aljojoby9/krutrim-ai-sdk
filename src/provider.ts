import {
  generateId,
  loadApiKey,
  withoutTrailingSlash,
} from '@ai-sdk/provider-utils';
import { KrutrimLanguageDetectionModel } from './bhashik/language-detection';
import {
  KrutrimSpeechModel,
  type KrutrimSpeechSettings,
} from './bhashik/speech-model';
import { KrutrimTranscriptionModel } from './bhashik/transcription-model';
import {
  KrutrimTranslationModel,
  type TranslationSettings,
} from './bhashik/translation';
import { KrutrimChatLanguageModel } from './chat/language-model';
import type { ChatModelId, ChatSettings } from './chat/settings';
import {
  KRUTRIM_DEFAULT_API_HOST,
  KRUTRIM_DEFAULT_BASE_URL,
  type KrutrimProviderSettings,
  resolveKrutrimApiKey,
} from './config';
import { KrutrimEmbeddingModel } from './embedding/embedding-model';
import type { BhashikLanguageCode, IndicLanguageCode } from './indic/languages';
import type { EmbeddingModelId } from './models';
import type { KrutrimProvider } from './types';

/**
 * Create a Krutrim Cloud provider instance.
 *
 * @example
 * ```ts
 * import { createKrutrim } from 'krutrim-ai-sdk';
 *
 * const krutrim = createKrutrim({
 *   apiKey: process.env.KRUTRIM_API_KEY,
 *   // baseURL: 'https://cloud.olakrutrim.com/v1',
 * });
 * ```
 */
export function createKrutrim(
  options: KrutrimProviderSettings = {},
): KrutrimProvider {
  const baseURL =
    withoutTrailingSlash(options.baseURL) ?? KRUTRIM_DEFAULT_BASE_URL;

  const apiHost =
    withoutTrailingSlash(options.apiHost) ?? KRUTRIM_DEFAULT_API_HOST;

  const getApiKey = () => {
    const resolved = resolveKrutrimApiKey(options.apiKey);
    return loadApiKey({
      apiKey: resolved,
      environmentVariableName: 'KRUTRIM_API_KEY',
      description: 'Krutrim Cloud',
    });
  };

  const getHeaders = () => {
    const apiKey = getApiKey();
    return {
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': 'krutrim-ai-sdk',
      ...options.headers,
    };
  };

  const sharedConfig = {
    headers: getHeaders,
    fetch: options.fetch,
    generateId: options.generateId ?? generateId,
    url: ({ path }: { path: string; modelId: string }) => `${baseURL}${path}`,
    languageLabsUrl: (path: string) => {
      const normalized = path.startsWith('/') ? path : `/${path}`;
      return `${apiHost}/api/v1${normalized}`;
    },
  };

  const createChatModel = (
    modelId: ChatModelId,
    settings: ChatSettings = {},
  ) =>
    new KrutrimChatLanguageModel(modelId, settings, {
      ...sharedConfig,
      provider: 'krutrim.chat',
    });

  const createLanguageModel = (
    modelId: ChatModelId,
    settings?: ChatSettings,
  ) => {
    if (new.target) {
      throw new Error(
        'The Krutrim model function cannot be called with the new keyword.',
      );
    }
    return createChatModel(modelId, settings);
  };

  const createEmbeddingModel = (modelId: EmbeddingModelId) =>
    new KrutrimEmbeddingModel(modelId, {
      ...sharedConfig,
      provider: 'krutrim.embedding',
    });

  const provider = ((modelId: ChatModelId, settings?: ChatSettings) =>
    createLanguageModel(modelId, settings)) as unknown as KrutrimProvider;

  provider.languageModel = createLanguageModel as KrutrimProvider['languageModel'];
  provider.chat = createChatModel as KrutrimProvider['chat'];
  provider.embedding = createEmbeddingModel;
  provider.embeddingModel = createEmbeddingModel;
  provider.textEmbeddingModel = createEmbeddingModel;

  provider.speech = (
    language: IndicLanguageCode | BhashikLanguageCode | string,
    settings?: KrutrimSpeechSettings,
  ) =>
    new KrutrimSpeechModel(language, settings ?? {}, {
      ...sharedConfig,
      provider: 'krutrim.speech',
    });

  provider.transcription = (
    language: IndicLanguageCode | BhashikLanguageCode | string,
  ) =>
    new KrutrimTranscriptionModel(language, {
      ...sharedConfig,
      provider: 'krutrim.transcription',
    });

  provider.languageDetection = () =>
    new KrutrimLanguageDetectionModel({
      ...sharedConfig,
      provider: 'krutrim.language-detection',
    });

  provider.translation = (settings: TranslationSettings) =>
    new KrutrimTranslationModel(settings, {
      ...sharedConfig,
      provider: 'krutrim.translation',
    });

  return provider;
}

/**
 * Default Krutrim provider instance.
 *
 * Reads `KRUTRIM_API_KEY` or `KRUTRIM_CLOUD_API_KEY` from the environment.
 *
 * @example
 * ```ts
 * import { krutrim } from 'krutrim-ai-sdk';
 * import { generateText } from 'ai';
 *
 * const { text } = await generateText({
 *   model: krutrim('Krutrim-2'),
 *   prompt: 'Write a haiku about monsoons in Kerala.',
 * });
 * ```
 */
export const krutrim = createKrutrim();
