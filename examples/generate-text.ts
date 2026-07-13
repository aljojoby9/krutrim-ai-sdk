/**
 * Basic non-streaming text generation with Krutrim-2.
 *
 *   npx tsx --env-file=.env examples/generate-text.ts
 */
import { generateText } from 'ai';
import { krutrim, indicResponsePrompt } from '../src';

async function main() {
  const { text, usage } = await generateText({
    model: krutrim('Krutrim-2'),
    system: indicResponsePrompt('hi-IN'),
    prompt: 'मुंबई के बारे में तीन रोचक तथ्य बताओ।',
  });

  console.log(text);
  console.log('\n--- tokens ---');
  console.log(usage);
}

main().catch(console.error);
