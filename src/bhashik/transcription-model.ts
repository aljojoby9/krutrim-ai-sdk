import type { TranscriptionModelV3 } from '@ai-sdk/provider';
import {
  combineHeaders,
  createJsonResponseHandler,
  postToApi,
} from '@ai-sdk/provider-utils';
import { z } from 'zod';
import type { KrutrimConfig } from '../config';
import { krutrimFailedResponseHandler } from '../error';
import {
  type BhashikLanguageCode,
  type IndicLanguageCode,
  toBhashikLanguageCode,
} from '../indic/languages';

const sttResponseSchema = z.object({
  status: z.string().nullish(),
  data: z
    .object({
      text: z.union([z.array(z.string()), z.string()]).nullish(),
    })
    .nullish(),
});

/**
 * Bhashik Speech-to-Text via upload (`/api/v1/languagelabs/transcribe/upload`).
 * Ideal for short mp3/wav clips (Krutrim-Dhwani family).
 */
export class KrutrimTranscriptionModel implements TranscriptionModelV3 {
  readonly specificationVersion = 'v3';
  readonly modelId: string;

  private readonly languageCode: BhashikLanguageCode;
  private readonly config: KrutrimConfig;

  constructor(
    language: IndicLanguageCode | BhashikLanguageCode | string,
    config: KrutrimConfig,
    /**
     * Optional catalogue model id (Sarvam-style `transcription(model, lang)`).
     * @default "Krutrim-Dhwani"
     */
    modelId: string = 'Krutrim-Dhwani',
  ) {
    const mapped = toBhashikLanguageCode(language);
    if (!mapped) {
      if (
        ['eng', 'guj', 'ben', 'hin', 'kan', 'mal', 'mar', 'tam', 'tel'].includes(
          language,
        )
      ) {
        this.languageCode = language as BhashikLanguageCode;
      } else {
        throw new Error(
          `Unsupported STT language "${language}". Use hi-IN, ta-IN, eng, hin, etc.`,
        );
      }
    } else {
      this.languageCode = mapped;
    }
    this.config = config;
    this.modelId = modelId;
  }

  get provider(): string {
    return this.config.provider;
  }

  async doGenerate({
    audio,
    mediaType,
    headers,
    abortSignal,
  }: Parameters<TranscriptionModelV3['doGenerate']>[0]): Promise<
    Awaited<ReturnType<TranscriptionModelV3['doGenerate']>>
  > {
    const formData = new FormData();

    let blob: Blob;
    if (typeof audio === 'string') {
      // base64
      const binary = Buffer.from(audio, 'base64');
      blob = new Blob([binary], { type: mediaType ?? 'audio/wav' });
    } else {
      blob = new Blob([audio as BlobPart], {
        type: mediaType ?? 'audio/wav',
      });
    }

    formData.append('file', blob, 'audio.wav');
    formData.append('lang_code', this.languageCode);

    // Strip content-type so fetch sets multipart boundary.
    const baseHeaders = { ...this.config.headers(), ...headers };
    delete baseHeaders['Content-Type'];
    delete baseHeaders['content-type'];

    const {
      responseHeaders,
      value: response,
      rawValue,
    } = await postToApi({
      url: this.config.languageLabsUrl('/languagelabs/transcribe/upload'),
      headers: combineHeaders(baseHeaders, undefined),
      body: {
        content: formData,
        values: formData,
      },
      failedResponseHandler: krutrimFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(sttResponseSchema),
      abortSignal,
      fetch: this.config.fetch,
    });

    const textField = response.data?.text;
    const text = Array.isArray(textField)
      ? textField.join(' ')
      : (textField ?? '');

    return {
      text,
      segments: [],
      language: this.languageCode,
      durationInSeconds: undefined,
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
