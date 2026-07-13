import { describe, expect, it } from 'vitest';
import {
  KRUTRIM_CHAT_MODELS,
  MODEL_ALIASES,
  resolveModelId,
} from '../src/models';

describe('resolveModelId', () => {
  it('resolves friendly aliases', () => {
    expect(resolveModelId('krutrim-2')).toBe('Krutrim-2');
    expect(resolveModelId('krutrim-1')).toBe('Krutrim-1');
    expect(resolveModelId('krutrim')).toBe('Krutrim-2');
    expect(resolveModelId('dhwani')).toBe('Krutrim-Dhwani');
    expect(resolveModelId('vyakyarth')).toBe('Vyakyarth');
  });

  it('passes through exact catalogue IDs', () => {
    expect(resolveModelId('Krutrim-2')).toBe('Krutrim-2');
    expect(resolveModelId('Llama-3.3-70B-Instruct')).toBe(
      'Llama-3.3-70B-Instruct',
    );
  });

  it('passes through unknown custom IDs', () => {
    expect(resolveModelId('my-fine-tuned-endpoint')).toBe(
      'my-fine-tuned-endpoint',
    );
  });

  it('exposes chat model constants', () => {
    expect(KRUTRIM_CHAT_MODELS.krutrim2).toBe('Krutrim-2');
    expect(MODEL_ALIASES['deepseek-r1']).toBe('DeepSeek-R1');
  });
});
