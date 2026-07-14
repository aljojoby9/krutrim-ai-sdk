import type { SpeechModelV3 } from '@ai-sdk/provider';
import {
  combineHeaders,
  createJsonResponseHandler,
  postJsonToApi,
} from '@ai-sdk/provider-utils';
import { z } from 'zod';
import type { KrutrimConfig } from '../config';
import { krutrimFailedResponseHandler } from '../error';
import {
  type BhashikLanguageCode,
  type IndicLanguageCode,
  toBhashikLanguageCode,
} from '../indic/languages';

const ttsResponseSchema = z.object({
  status: z.string().nullish(),
  data: z
    .object({
      audio_file: z.string().nullish(),
      // Some deployments may return base64 directly
      audio: z.string().nullish(),
      audio_base64: z.string().nullish(),
    })
    .nullish(),
});

export type KrutrimSpeechSettings = {
  /**
   * Speaker voice.
   * @default "female"
   */
  speaker?: 'female' | 'male';
  /**
   * Optional catalogue model id (for DX parity with Sarvam-style `speech(model, lang)`).
   * Bhashik TTS currently uses Language Labs endpoints; this is stored for metadata.
   * @default "Krutrim-TTS"
   */
  model?: string;
};

/**
 * Lightweight Bhashik Text-to-Speech model (`/api/v1/languagelabs/tts`).
 *
 * Note: The API often returns a download URL rather than raw audio bytes.
 * The model downloads that URL when needed so `generateSpeech` receives audio data.
 */
export class KrutrimSpeechModel implements SpeechModelV3 {
  readonly specificationVersion = 'v3';
  readonly modelId: string;

  private readonly languageCode: BhashikLanguageCode;
  private readonly settings: KrutrimSpeechSettings;
  private readonly config: KrutrimConfig;

  constructor(
    language: IndicLanguageCode | BhashikLanguageCode | string,
    settings: KrutrimSpeechSettings = {},
    config: KrutrimConfig,
  ) {
    const mapped = toBhashikLanguageCode(language);
    if (!mapped) {
      // Allow direct short codes like "hin"
      if (
        ['eng', 'guj', 'ben', 'hin', 'kan', 'mal', 'mar', 'tam', 'tel'].includes(
          language,
        )
      ) {
        this.languageCode = language as BhashikLanguageCode;
      } else {
        throw new Error(
          `Unsupported TTS language "${language}". Use hi-IN, ta-IN, eng, hin, etc.`,
        );
      }
    } else {
      this.languageCode = mapped;
    }
    this.settings = settings;
    this.config = config;
    this.modelId = settings.model ?? 'Krutrim-TTS';
  }

  get provider(): string {
    return this.config.provider;
  }

  async doGenerate({
    text,
    headers,
    abortSignal,
  }: Parameters<SpeechModelV3['doGenerate']>[0]): Promise<
    Awaited<ReturnType<SpeechModelV3['doGenerate']>>
  > {
    const {
      responseHeaders,
      value: response,
      rawValue,
    } = await postJsonToApi({
      url: this.config.languageLabsUrl('/languagelabs/tts'),
      headers: combineHeaders(this.config.headers(), headers),
      body: {
        input_text: text,
        input_language: this.languageCode,
        input_speaker: this.settings.speaker ?? 'female',
      },
      failedResponseHandler: krutrimFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(ttsResponseSchema),
      abortSignal,
      fetch: this.config.fetch,
    });

    let audioData: string | Uint8Array | undefined =
      response.data?.audio_base64 ?? response.data?.audio ?? undefined;

    const audioUrl = response.data?.audio_file;
    if (!audioData && audioUrl) {
      const fetchFn = this.config.fetch ?? globalThis.fetch;
      const audioResponse = await fetchFn(audioUrl, {
        headers: this.config.headers() as HeadersInit,
        signal: abortSignal,
      });
      if (!audioResponse.ok) {
        throw new Error(
          `Failed to download TTS audio from ${audioUrl}: ${audioResponse.status}`,
        );
      }
      const buffer = new Uint8Array(await audioResponse.arrayBuffer());
      audioData = buffer;
    }

    if (!audioData) {
      throw new Error(
        'Krutrim TTS response did not include audio data or a downloadable audio_file URL.',
      );
    }

    return {
      audio: audioData,
      warnings: [],
      response: {
        headers: responseHeaders,
        body: rawValue,
        timestamp: new Date(),
        modelId: this.modelId,
      },
    };
  }
}
