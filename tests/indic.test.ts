import { describe, expect, it } from 'vitest';
import {
  INDIC_LANGUAGES,
  toBhashikLanguageCode,
  toTranslationLanguageCode,
} from '../src/indic/languages';
import {
  indicResponsePrompt,
  indicSupportAgentPrompt,
  languageDetectionPrompt,
  transliterationNotes,
} from '../src/indic/prompts';

describe('Indic languages', () => {
  it('maps BCP-47 to Bhashik codes', () => {
    expect(toBhashikLanguageCode('hi-IN')).toBe('hin');
    expect(toBhashikLanguageCode('ta-IN')).toBe('tam');
    expect(toBhashikLanguageCode('en-IN')).toBe('eng');
  });

  it('builds translation tags with scripts', () => {
    expect(toTranslationLanguageCode('hi-IN')).toBe('hin_Deva');
    expect(toTranslationLanguageCode('en-IN')).toBe('eng_Latn');
    expect(toTranslationLanguageCode('hin_Deva')).toBe('hin_Deva');
  });

  it('lists major Indian languages', () => {
    const codes = INDIC_LANGUAGES.map((l) => l.code);
    expect(codes).toContain('hi-IN');
    expect(codes).toContain('ml-IN');
    expect(codes).toContain('ta-IN');
  });
});

describe('Indic prompts', () => {
  it('builds a response prompt with native script preference', () => {
    const prompt = indicResponsePrompt('hi-IN');
    expect(prompt).toContain('Hindi');
    expect(prompt).toContain('native script');
  });

  it('builds language detection instructions', () => {
    expect(languageDetectionPrompt()).toContain('BCP-47');
  });

  it('mentions Romanized Indic in transliteration notes', () => {
    expect(transliterationNotes('hi-IN')).toMatch(/Hinglish|Romanized/i);
  });

  it('builds a support agent prompt with INR awareness', () => {
    const prompt = indicSupportAgentPrompt({ brandName: 'PayApp' });
    expect(prompt).toContain('PayApp');
    expect(prompt).toContain('INR');
  });
});
