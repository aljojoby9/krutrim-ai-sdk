import type { LanguageModelV3CallOptions } from '@ai-sdk/provider';

/**
 * Collect text from user messages only (Sarvam-style TTT helpers ignore
 * system / assistant roles).
 */
export function extractUserText(options: LanguageModelV3CallOptions): string {
  const prompt = options.prompt as unknown;

  if (typeof prompt === 'string') {
    return prompt;
  }

  if (!Array.isArray(prompt)) {
    return '';
  }

  const parts: string[] = [];
  for (const message of prompt as LanguageModelV3CallOptions['prompt']) {
    if (message.role === 'user') {
      for (const part of message.content) {
        if (part.type === 'text') {
          parts.push(part.text);
        }
      }
    }
  }
  return parts.join('\n');
}
