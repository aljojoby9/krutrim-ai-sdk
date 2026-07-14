import type {
  EmbeddingModelV3,
  LanguageModelV3,
  SpeechModelV3,
  TranscriptionModelV3,
} from '@ai-sdk/provider';
import type { SentimentSettings } from './bhashik/sentiment';
import type { KrutrimSpeechSettings } from './bhashik/speech-model';
import type { SummarizationSettings } from './bhashik/summarization';
import type { TranslationSettings } from './bhashik/translation';
import type { TransliterateSettings } from './bhashik/transliterate';
import type { ChatModelId, ChatSettings } from './chat/settings';
import type { EmbeddingModelId } from './models';
import type { BhashikLanguageCode, IndicLanguageCode } from './indic/languages';

/**
 * Krutrim provider interface — callable + factory methods.
 *
 * Surface mirrors [sarvam-ai-sdk](https://github.com/sarvamai/sarvam-ai-sdk)
 * (chat, speech, transcription, translation, transliterate, language ID)
 * plus Krutrim extras (embeddings, summarization, sentiment).
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
   * // language-first (simple)
   * krutrim.speech('hi-IN')
   * // Sarvam-style: model + language
   * krutrim.speech('Krutrim-TTS', 'hi-IN')
   * ```
   */
  speech(
    languageOrModel: IndicLanguageCode | BhashikLanguageCode | string,
    languageOrSettings?:
      | IndicLanguageCode
      | BhashikLanguageCode
      | string
      | KrutrimSpeechSettings,
    settings?: KrutrimSpeechSettings,
  ): SpeechModelV3;

  /**
   * Bhashik Speech-to-Text (Krutrim-Dhwani family).
   *
   * @example
   * ```ts
   * krutrim.transcription('hi-IN')
   * krutrim.transcription('Krutrim-Dhwani', 'hi-IN')
   * ```
   */
  transcription(
    languageOrModel: IndicLanguageCode | BhashikLanguageCode | string,
    language?: IndicLanguageCode | BhashikLanguageCode | string,
  ): TranscriptionModelV3;

  /**
   * Bhashik language detection (works with `generateText`).
   */
  languageDetection(): LanguageModelV3;

  /**
   * Alias of {@link KrutrimProvider.languageDetection} (Sarvam naming).
   */
  languageIdentification(): LanguageModelV3;

  /**
   * Bhashik text translation (works with `generateText`).
   *
   * @example
   * ```ts
   * krutrim.translation({ from: 'hi-IN', to: 'en-IN' })
   * // Sarvam-style: model first
   * krutrim.translation('krutrim-translate-v1.0', { from: 'hi-IN', to: 'en-IN' })
   * ```
   */
  translation(
    modelOrSettings: string | TranslationSettings,
    settings?: TranslationSettings,
  ): LanguageModelV3;

  /**
   * Transliteration (Sarvam-compatible API).
   * Uses chat completions under the hood (no dedicated Bhashik endpoint).
   *
   * @example
   * ```ts
   * const { text } = await generateText({
   *   model: krutrim.transliterate({ to: 'hi-IN', from: 'en-IN' }),
   *   prompt: 'eda mone, happy alle?',
   * });
   * ```
   */
  transliterate(settings: TransliterateSettings): LanguageModelV3;

  /**
   * Bhashik summarization.
   */
  summarization(settings?: SummarizationSettings): LanguageModelV3;

  /**
   * Bhashik sentiment analysis.
   */
  sentiment(settings?: SentimentSettings): LanguageModelV3;
};
