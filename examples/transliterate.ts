/**
 * Transliteration (Sarvam-style helper).
 *
 *   npx tsx --env-file=.env examples/transliterate.ts
 */
import { generateText } from 'ai';
import { krutrim } from '../src';

async function main() {
  const { text } = await generateText({
    model: krutrim.transliterate({ to: 'hi-IN', from: 'en-IN' }),
    prompt: 'namaste, aap kaise ho?',
  });

  console.log(text);
}

main().catch(console.error);
