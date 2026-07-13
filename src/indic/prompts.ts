import type { IndicLanguageCode } from './languages';
import { INDIC_LANGUAGES } from './languages';

function languageLabel(code: IndicLanguageCode | string): string {
  const entry = INDIC_LANGUAGES.find((l) => l.code === code);
  if (entry) {
    return `${entry.name} (${entry.nativeName})`;
  }
  return code;
}

/**
 * System prompt that steers the model to respond in a target Indian language.
 */
export function indicResponsePrompt(
  language: IndicLanguageCode | string,
  options?: {
    /** Prefer native script over Latin transliteration. @default true */
    nativeScript?: boolean;
    /** Allow code-mixing (Hinglish, Tanglish, etc.). @default false */
    allowCodeMix?: boolean;
  },
): string {
  const nativeScript = options?.nativeScript ?? true;
  const allowCodeMix = options?.allowCodeMix ?? false;
  const label = languageLabel(language);

  return [
    `You are a helpful assistant optimized for Indian languages and culture.`,
    `Respond primarily in ${label}.`,
    nativeScript
      ? `Prefer the language's native script over Latin transliteration unless the user writes in Latin script and clearly wants Romanized output.`
      : `Latin / Romanized script is acceptable when natural for the user.`,
    allowCodeMix
      ? `Light code-mixing with English is fine when it matches how speakers actually talk.`
      : `Avoid unnecessary English code-mixing unless the user does so first.`,
    `Be culturally aware of Indian context (festivals, geography, INR, regional nuance) without stereotyping.`,
  ].join(' ');
}

/**
 * Prompt fragment for language identification via a chat model.
 * Prefer {@link krutrim.languageDetection} (Bhashik API) when available.
 */
export function languageDetectionPrompt(): string {
  return [
    'Identify the primary language of the user message.',
    'Reply with ONLY a BCP-47 language tag such as hi-IN, ta-IN, en-IN, bn-IN, ml-IN.',
    'If mixed, pick the dominant language. No explanation.',
  ].join(' ');
}

/**
 * Notes for apps that accept Romanized Indic input (Hinglish, etc.).
 * Attach as a system hint when users type in Latin script.
 */
export function transliterationNotes(targetLanguage?: IndicLanguageCode | string): string {
  const target = targetLanguage
    ? ` When responding, prefer native script for ${languageLabel(targetLanguage)} unless asked otherwise.`
    : '';

  return [
    'Users may type Indian languages in Latin script (e.g. Hinglish: "aap kaise ho", Tanglish, etc.).',
    'Interpret Romanized Indic phonetically; do not treat it as English only.',
    'When the meaning is clear, reply in the same language; offer native script when helpful.',
    target,
  ]
    .join(' ')
    .trim();
}

/**
 * Lightweight system prompt for multilingual Indian customer-support agents.
 */
export function indicSupportAgentPrompt(options?: {
  brandName?: string;
  languages?: Array<IndicLanguageCode | string>;
}): string {
  const brand = options?.brandName ?? 'our service';
  const langs =
    options?.languages?.map(languageLabel).join(', ') ??
    'Hindi, English (India), and other major Indian languages';

  return [
    `You are a polite, efficient customer support agent for ${brand}.`,
    `You can assist in: ${langs}.`,
    `Mirror the customer's language and script when possible.`,
    `Keep answers clear, short, and actionable. Amounts should use ₹ / INR when relevant.`,
    `If you are unsure, ask a clarifying question instead of guessing personal data.`,
  ].join(' ');
}
