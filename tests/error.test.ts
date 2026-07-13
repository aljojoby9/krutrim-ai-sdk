import { describe, expect, it } from 'vitest';
import { enhanceKrutrimErrorMessage } from '../src/error';

describe('enhanceKrutrimErrorMessage', () => {
  it('adds API key guidance on 401', () => {
    const msg = enhanceKrutrimErrorMessage('Unauthorized', 401);
    expect(msg).toContain('KRUTRIM_API_KEY');
    expect(msg).toContain('cloud.olakrutrim.com');
  });

  it('adds rate limit / INR billing tips on 429', () => {
    const msg = enhanceKrutrimErrorMessage('Too many requests', 429);
    expect(msg).toContain('Rate limit');
    expect(msg).toContain('INR');
  });

  it('adds model catalogue tips for invalid model', () => {
    const msg = enhanceKrutrimErrorMessage('Invalid model: foo', 400);
    expect(msg).toContain('Model Catalogue');
  });

  it('adds credits tip for billing errors', () => {
    const msg = enhanceKrutrimErrorMessage('Insufficient credits');
    expect(msg).toContain('INR');
    expect(msg).toContain('Usage & Transactions');
  });

  it('returns raw message when no special case', () => {
    expect(enhanceKrutrimErrorMessage('Something odd')).toBe('Something odd');
  });
});
