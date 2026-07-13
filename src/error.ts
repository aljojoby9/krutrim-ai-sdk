import { createJsonErrorResponseHandler } from '@ai-sdk/provider-utils';
import { z } from 'zod';

/**
 * Flexible error payload — Krutrim surfaces both OpenAI-style and
 * Language Labs-style error bodies.
 */
export const krutrimErrorDataSchema = z.object({
  error: z
    .union([
      z.string(),
      z.object({
        message: z.string().optional(),
        type: z.string().optional(),
        code: z.union([z.string(), z.number()]).optional(),
        param: z.string().nullable().optional(),
      }),
    ])
    .optional(),
  message: z.string().optional(),
  status: z.union([z.string(), z.number()]).optional(),
  detail: z
    .object({
      info: z.string().optional(),
    })
    .passthrough()
    .optional(),
  // OpenAI-compatible sometimes nests differently
  code: z.union([z.string(), z.number()]).optional(),
});

export type KrutrimErrorData = z.infer<typeof krutrimErrorDataSchema>;

function extractRawMessage(data: KrutrimErrorData): string {
  if (typeof data.error === 'string' && data.error.length > 0) {
    return data.error;
  }
  if (
    data.error &&
    typeof data.error === 'object' &&
    typeof data.error.message === 'string' &&
    data.error.message.length > 0
  ) {
    return data.error.message;
  }
  if (typeof data.message === 'string' && data.message.length > 0) {
    return data.message;
  }
  if (data.detail?.info) {
    return data.detail.info;
  }
  return 'Unknown Krutrim API error';
}

/**
 * Enrich raw API errors with India / Krutrim-specific guidance.
 */
export function enhanceKrutrimErrorMessage(
  rawMessage: string,
  statusCode?: number,
): string {
  const lower = rawMessage.toLowerCase();
  const tips: string[] = [];

  if (
    statusCode === 401 ||
    lower.includes('unauthorized') ||
    lower.includes('invalid api key') ||
    lower.includes('authentication') ||
    lower.includes('api key')
  ) {
    tips.push(
      'Check KRUTRIM_API_KEY or KRUTRIM_CLOUD_API_KEY (console: https://cloud.olakrutrim.com).',
      'Keys can be regenerated under Key Management → Model API Keys.',
    );
  }

  if (statusCode === 403 || lower.includes('forbidden') || lower.includes('region')) {
    tips.push(
      'This model or endpoint may be restricted to supported regions / account tiers.',
      'Confirm your Krutrim Cloud account has access in the console.',
    );
  }

  if (
    statusCode === 429 ||
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('quota')
  ) {
    tips.push(
      'Rate limit or quota exceeded. Back off and retry with exponential delay.',
      'Billing is typically INR-based on Krutrim Cloud — top up credits under Usage & Transactions if balance is low.',
    );
  }

  if (
    lower.includes('insufficient') ||
    lower.includes('credit') ||
    lower.includes('balance') ||
    lower.includes('payment') ||
    lower.includes('billing')
  ) {
    tips.push(
      'Krutrim Cloud usage is billed in INR. Add credits at https://cloud.olakrutrim.com (Usage & Transactions).',
    );
  }

  if (
    lower.includes('model') &&
    (lower.includes('not found') ||
      lower.includes('invalid') ||
      lower.includes('does not exist') ||
      lower.includes('unknown'))
  ) {
    tips.push(
      'Copy the exact model string from the Model Catalogue (case-sensitive).',
      'Try aliases like "krutrim-2" → "Krutrim-2", or pass the catalogue ID directly.',
    );
  }

  if (statusCode === 404) {
    tips.push(
      'Verify baseURL is https://cloud.olakrutrim.com/v1 for chat/embeddings.',
      'Language Labs (Bhashik) uses https://cloud.olakrutrim.com/api/v1/...',
    );
  }

  if (statusCode != null && statusCode >= 500) {
    tips.push(
      'Krutrim API returned a server error. Retry shortly; check status in the console if it persists.',
    );
  }

  if (tips.length === 0) {
    return rawMessage;
  }

  return `${rawMessage}\n\n💡 Krutrim tips:\n${tips.map((t) => `  • ${t}`).join('\n')}`;
}

export const krutrimFailedResponseHandler = createJsonErrorResponseHandler({
  errorSchema: krutrimErrorDataSchema,
  errorToMessage: (data) => enhanceKrutrimErrorMessage(extractRawMessage(data)),
});
