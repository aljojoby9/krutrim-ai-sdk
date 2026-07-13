/**
 * Streaming text generation.
 *
 *   npx tsx --env-file=.env examples/stream-text.ts
 */
import { streamText } from 'ai';
import { krutrim } from '../src';

async function main() {
  const result = streamText({
    model: krutrim('Krutrim-2'),
    prompt: 'Write a short poem about the Indian monsoon in English.',
  });

  for await (const delta of result.textStream) {
    process.stdout.write(delta);
  }

  console.log('\n');
}

main().catch(console.error);
