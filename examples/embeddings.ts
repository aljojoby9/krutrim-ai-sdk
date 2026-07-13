/**
 * Embeddings with Vyakyarth.
 *
 *   npx tsx --env-file=.env examples/embeddings.ts
 */
import { embed, embedMany } from 'ai';
import { krutrim } from '../src';

async function main() {
  const { embedding } = await embed({
    model: krutrim.embedding('Vyakyarth'),
    value: 'भारत की राजधानी नई दिल्ली है।',
  });

  console.log('dimensions:', embedding.length);
  console.log('first 5:', embedding.slice(0, 5));

  const { embeddings } = await embedMany({
    model: krutrim.embedding('Bhasantarit'),
    values: ['Hello from India', 'नमस्ते भारत', 'வணக்கம்'],
  });

  console.log('batch size:', embeddings.length);
}

main().catch(console.error);
