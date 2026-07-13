import type {
  EmbeddingModelV3,
  LanguageModelV3,
  SpeechModelV3,
  TranscriptionModelV3,
} from '@ai-sdk/provider';
import type { KrutrimSpeechSettings } from './bhashik/speech-model';
import type { TranslationSettings } from './bhashik/translation';
import type { ChatModelId, ChatSettings } from './chat/settings';
import type { EmbeddingModelId } from './models';
import type { BhashikLanguageCode, IndicLanguageCode } from './indic/languages';

/**
 * Krutrim provider interface — callable + factory methods.
 *
 * @example
 * ```ts
 * import { krutrim } from 'krutrim-ai-sdk';
 * import { generateText } from 'ai';
 *
 * const { text } = await generateText({
 *   model: krutrim('Krutrim-2'),
 *   prompt: 'नमस्ते! आज मौसम कैसा है?',
 * });
 * ```
 */
export type KrutrimProvider = {
  /**
   * Create a chat / text-generation model.
   */
  (modelId: ChatModelId, settings?: ChatSettings): LanguageModelV3;

  /**
   * Create a chat language model (alias of the call signature).
   */
  languageModel(modelId: ChatModelId, settings?: ChatSettings): LanguageModelV3;

  /**
   * Create a chat model (alias of `languageModel`).
   */
  chat(modelId: ChatModelId, settings?: ChatSettings): LanguageModelV3;

  /**
   * Create an embedding model (e.g. Vyakyarth, Bhasantarit).
   */
  embedding(modelId: EmbeddingModelId): EmbeddingModelV3;

  /**
   * Alias for {@link KrutrimProvider.embedding}.
   */
  embeddingModel(modelId: EmbeddingModelId): EmbeddingModelV3;

  /**
   * Create a text-embedding model (AI SDK naming).
   */
  textEmbeddingModel(modelId: EmbeddingModelId): EmbeddingModelV3;

  /**
   * Bhashik Text-to-Speech.
   *
   * @example
   * ```ts
   * import { experimental_generateSpeech as generateSpeech } from 'ai';
   * const { audio } = await generateSpeech({
   *   model: krutrim.speech('hi-IN'),
   *   text: 'नमस्ते, भारत!',
   * });
   * ```
   */
  speech(
    language: IndicLanguageCode | BhashikLanguageCode | string,
    settings?: KrutrimSpeechSettings,
  ): SpeechModelV3;

  /**
   * Bhashik Speech-to-Text (Krutrim-Dhwani family).
   *
   * @example
   * ```ts
   * import { experimental_transcribe as transcribe } from 'ai';
   * const { text } = await transcribe({
   *   model: krutrim.transcription('hi-IN'),
   *   audio: await readFile('./clip.wav'),
   * });
   * ```
   */
  transcription(
    language: IndicLanguageCode | BhashikLanguageCode | string,
  ): TranscriptionModelV3;

  /**
   * Bhashik language detection (works with `generateText`).
   */
  languageDetection(): LanguageModelV3;

  /**
   * Bhashik text translation (works with `generateText`).
   *
   * @example
   * ```ts
   * const { text } = await generateText({
   *   model: krutrim.translation({ from: 'hi-IN', to: 'en-IN' }),
   *   prompt: 'आज मौसम बहुत सुहाना है।',
   * });
   * ```
   */
  translation(settings: TranslationSettings): LanguageModelV3;
};
