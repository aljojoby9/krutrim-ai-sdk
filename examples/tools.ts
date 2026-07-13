/**
 * Tool calling example.
 *
 *   npx tsx --env-file=.env examples/tools.ts
 */
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { krutrim } from '../src';

async function main() {
  const result = await generateText({
    model: krutrim('Krutrim-2'),
    tools: {
      getWeather: tool({
        description: 'Get the current weather in an Indian city',
        inputSchema: z.object({
          city: z.string().describe('City name, e.g. Bengaluru'),
        }),
        execute: async ({ city }) => ({
          city,
          temperatureC: 28 + Math.floor(Math.random() * 8),
          condition: 'Partly cloudy',
          unit: 'celsius',
        }),
      }),
    },
    system: 'You are a helpful assistant for Indian cities. Use tools when needed.',
    prompt: 'What is the weather like in Kochi right now?',
  });

  console.log('text:', result.text);
  console.log('tool results:', result.toolResults);
}

main().catch(console.error);
