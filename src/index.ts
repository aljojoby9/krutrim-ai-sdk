// Provider
export { createKrutrim, krutrim } from './provider';
export type { KrutrimProvider } from './types';
export type { KrutrimProviderSettings, KrutrimConfig } from './config';
export {
  KRUTRIM_DEFAULT_BASE_URL,
  KRUTRIM_DEFAULT_API_HOST,
  resolveKrutrimApiKey,
} from './config';

// Models
export {
  KRUTRIM_CHAT_MODELS,
  KRUTRIM_EMBEDDING_MODELS,
  KRUTRIM_SPEECH_MODELS,
  KRUTRIM_VISION_MODELS,
  MODEL_ALIASES,
  resolveModelId,
} from './models';
export type {
  ChatModelId,
  EmbeddingModelId,
  SpeechModelId,
} from './models';

// Chat settings
export type { ChatSettings } from './chat/settings';

// Errors
export {
  enhanceKrutrimErrorMessage,
  krutrimFailedResponseHandler,
  krutrimErrorDataSchema,
} from './error';
export type { KrutrimErrorData } from './error';

// Indic helpers
export {
  INDIC_LANGUAGES,
  toBhashikLanguageCode,
  toTranslationLanguageCode,
} from './indic/languages';
export type {
  IndicLanguageCode,
  BhashikLanguageCode,
  TranslationLanguageCode,
} from './indic/languages';
export {
  indicResponsePrompt,
  languageDetectionPrompt,
  transliterationNotes,
  indicSupportAgentPrompt,
} from './indic/prompts';

// Bhashik settings
export type { KrutrimSpeechSettings } from './bhashik/speech-model';
export type { TranslationSettings } from './bhashik/translation';
