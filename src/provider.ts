import {
  generateId,
  loadApiKey,
  withoutTrailingSlash,
} from '@ai-sdk/provider-utils';
import { KrutrimLanguageDetectionModel } from './bhashik/language-detection';
import { KrutrimSentimentModel } from './bhashik/sentiment';
import {
  KrutrimSpeechModel,
  type KrutrimSpeechSettings,
} from './bhashik/speech-model';
import { KrutrimSummarizationModel } from './bhashik/summarization';
import { KrutrimTranscriptionModel } from './bhashik/transcription-model';
import {
  KrutrimTranslationModel,
  type TranslationSettings,
} from './bhashik/translation';
import {
  KrutrimTransliterateModel,
  type TransliterateSettings,
} from './bhashik/transliterate';
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

const BHASHIK_LANG_HINTS = new Set([
  'eng',
  'guj',
  'ben',
  'hin',
  'kan',
  'mal',
  'mar',
  'tam',
  'tel',
  'pan',
  'hi-IN',
  'bn-IN',
  'kn-IN',
  'ml-IN',
  'mr-IN',
  'or-IN',
  'pa-IN',
  'ta-IN',
  'te-IN',
  'gu-IN',
  'as-IN',
  'ur-IN',
  'en-IN',
  'sa-IN',
  'ne-IN',
]);

function looksLikeLanguageCode(value: string): boolean {
  if (BHASHIK_LANG_HINTS.has(value)) return true;
  // BCP-47 like xx-IN or short 2–3 letter codes
  return /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/i.test(value) && value.length <= 8;
}

/**
 * Create a Krutrim Cloud provider instance.
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

  const createLid = () =>
    new KrutrimLanguageDetectionModel({
      ...sharedConfig,
      provider: 'krutrim.language-detection',
    });

  const provider = ((modelId: ChatModelId, settings?: ChatSettings) =>
    createLanguageModel(modelId, settings)) as unknown as KrutrimProvider;

  provider.languageModel =
    createLanguageModel as KrutrimProvider['languageModel'];
  provider.chat = createChatModel as KrutrimProvider['chat'];
  provider.embedding = createEmbeddingModel;
  provider.embeddingModel = createEmbeddingModel;
  provider.textEmbeddingModel = createEmbeddingModel;

  provider.speech = (
    languageOrModel: string,
    languageOrSettings?: string | KrutrimSpeechSettings,
    settings?: KrutrimSpeechSettings,
  ) => {
    // Sarvam-style: speech(modelId, language, settings?)
    if (
      typeof languageOrSettings === 'string' &&
      looksLikeLanguageCode(languageOrSettings)
    ) {
      return new KrutrimSpeechModel(
        languageOrSettings,
        { ...(settings ?? {}), model: languageOrModel },
        { ...sharedConfig, provider: 'krutrim.speech' },
      );
    }

    // language-first: speech(language, settings?)
    return new KrutrimSpeechModel(
      languageOrModel as IndicLanguageCode | BhashikLanguageCode | string,
      (languageOrSettings as KrutrimSpeechSettings | undefined) ?? {},
      { ...sharedConfig, provider: 'krutrim.speech' },
    );
  };

  provider.transcription = (
    languageOrModel: string,
    language?: string,
  ) => {
    // Sarvam-style: transcription(modelId, language)
    if (language && looksLikeLanguageCode(language)) {
      return new KrutrimTranscriptionModel(
        language,
        { ...sharedConfig, provider: 'krutrim.transcription' },
        languageOrModel,
      );
    }

    return new KrutrimTranscriptionModel(languageOrModel, {
      ...sharedConfig,
      provider: 'krutrim.transcription',
    });
  };

  provider.languageDetection = createLid;
  provider.languageIdentification = createLid;

  provider.translation = (
    modelOrSettings: string | TranslationSettings,
    settings?: TranslationSettings,
  ) => {
    // Sarvam-style: translation(modelId, settings)
    if (typeof modelOrSettings === 'string') {
      if (!settings) {
        throw new Error(
          'translation(model, settings) requires settings with `from` and `to`.',
        );
      }
      return new KrutrimTranslationModel(
        { ...settings, model: modelOrSettings },
        { ...sharedConfig, provider: 'krutrim.translation' },
      );
    }

    return new KrutrimTranslationModel(modelOrSettings, {
      ...sharedConfig,
      provider: 'krutrim.translation',
    });
  };

  provider.transliterate = (settings: TransliterateSettings) =>
    new KrutrimTransliterateModel(settings, {
      ...sharedConfig,
      provider: 'krutrim.transliterate',
    });

  provider.summarization = (settings) =>
    new KrutrimSummarizationModel(settings ?? {}, {
      ...sharedConfig,
      provider: 'krutrim.summarization',
    });

  provider.sentiment = (settings) =>
    new KrutrimSentimentModel(settings ?? {}, {
      ...sharedConfig,
      provider: 'krutrim.sentiment',
    });

  return provider;
}

/**
 * Default Krutrim provider instance.
 *
 * Reads `KRUTRIM_API_KEY` or `KRUTRIM_CLOUD_API_KEY` from the environment.
 */
export const krutrim = createKrutrim();
