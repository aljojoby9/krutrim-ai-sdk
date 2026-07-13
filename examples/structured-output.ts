/**
 * Structured object generation (AI SDK 6 Output API).
 *
 *   npx tsx --env-file=.env examples/structured-output.ts
 */
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { krutrim } from '../src';

async function main() {
  const { output } = await generateText({
    model: krutrim('Krutrim-2'),
    output: Output.object({
      name: 'Recipe',
      description: 'A simple Indian recipe',
      schema: z.object({
        name: z.string(),
        cuisine: z.string(),
        ingredients: z.array(z.string()),
        steps: z.array(z.string()),
        spiceLevel: z.enum(['mild', 'medium', 'hot']),
      }),
    }),
    prompt: 'Generate a simple South Indian breakfast recipe.',
  });

  console.log(JSON.stringify(output, null, 2));
}

main().catch(console.error);
