/**
 * ISO / BCP-47 style Indian language codes used across helpers.
 */
export type IndicLanguageCode =
  | 'hi-IN' // Hindi
  | 'bn-IN' // Bengali
  | 'kn-IN' // Kannada
  | 'ml-IN' // Malayalam
  | 'mr-IN' // Marathi
  | 'or-IN' // Odia
  | 'pa-IN' // Punjabi
  | 'ta-IN' // Tamil
  | 'te-IN' // Telugu
  | 'gu-IN' // Gujarati
  | 'as-IN' // Assamese
  | 'ur-IN' // Urdu
  | 'en-IN' // Indian English
  | 'sa-IN' // Sanskrit
  | 'ne-IN'; // Nepali

/**
 * Short ISO-639-3 style codes used by Bhashik / Language Labs.
 */
export type BhashikLanguageCode =
  | 'eng'
  | 'hin'
  | 'ben'
  | 'mar'
  | 'tam'
  | 'tel'
  | 'kan'
  | 'mal'
  | 'pan'
  | 'guj';

/**
 * Translation API uses script-aware codes like `hin_Deva`, `eng_Latn`.
 */
export type TranslationLanguageCode = string;

export const INDIC_LANGUAGES: ReadonlyArray<{
  code: IndicLanguageCode;
  bhashik: BhashikLanguageCode | null;
  name: string;
  nativeName: string;
  script: string;
  notes?: string;
}> = [
  {
    code: 'hi-IN',
    bhashik: 'hin',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Deva',
  },
  {
    code: 'bn-IN',
    bhashik: 'ben',
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'Beng',
  },
  {
    code: 'ta-IN',
    bhashik: 'tam',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Taml',
  },
  {
    code: 'te-IN',
    bhashik: 'tel',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telu',
  },
  {
    code: 'mr-IN',
    bhashik: 'mar',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'Deva',
  },
  {
    code: 'gu-IN',
    bhashik: 'guj',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'Gujr',
  },
  {
    code: 'kn-IN',
    bhashik: 'kan',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Knda',
  },
  {
    code: 'ml-IN',
    bhashik: 'mal',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Mlym',
  },
  {
    code: 'pa-IN',
    bhashik: 'pan',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'Guru',
  },
  {
    code: 'or-IN',
    bhashik: null,
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    script: 'Orya',
    notes: 'Not all Bhashik endpoints list Odia yet.',
  },
  {
    code: 'as-IN',
    bhashik: null,
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    script: 'Beng',
  },
  {
    code: 'ur-IN',
    bhashik: null,
    name: 'Urdu',
    nativeName: 'اردو',
    script: 'Arab',
  },
  {
    code: 'en-IN',
    bhashik: 'eng',
    name: 'English (India)',
    nativeName: 'English',
    script: 'Latn',
  },
  {
    code: 'sa-IN',
    bhashik: null,
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    script: 'Deva',
  },
  {
    code: 'ne-IN',
    bhashik: null,
    name: 'Nepali',
    nativeName: 'नेपाली',
    script: 'Deva',
  },
];

/**
 * Map BCP-47 Indic codes to Bhashik short codes when available.
 */
export function toBhashikLanguageCode(
  code: IndicLanguageCode | string,
): BhashikLanguageCode | null {
  const entry = INDIC_LANGUAGES.find(
    (l) => l.code === code || l.bhashik === code,
  );
  return entry?.bhashik ?? null;
}

/**
 * Build a translation-style language tag, e.g. `hin_Deva`, `eng_Latn`.
 */
export function toTranslationLanguageCode(
  code: IndicLanguageCode | string,
): TranslationLanguageCode {
  const entry = INDIC_LANGUAGES.find(
    (l) => l.code === code || l.bhashik === code,
  );
  if (!entry?.bhashik) {
    // Pass through already-qualified codes like hin_Deva
    if (code.includes('_')) return code;
    throw new Error(
      `No Bhashik/translation mapping for language "${code}". ` +
        `Use a supported code or pass an explicit tag like "hin_Deva".`,
    );
  }
  return `${entry.bhashik}_${entry.script}`;
}
