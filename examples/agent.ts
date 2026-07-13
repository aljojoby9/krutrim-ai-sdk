/**
 * Multilingual support-style agent with tools.
 *
 *   npx tsx --env-file=.env examples/agent.ts
 */
import { generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { krutrim, indicSupportAgentPrompt } from '../src';

async function main() {
  const result = await generateText({
    model: krutrim('Krutrim-2'),
    system: indicSupportAgentPrompt({
      brandName: 'KrutrimPay',
      languages: ['hi-IN', 'en-IN', 'ta-IN'],
    }),
    tools: {
      lookupOrder: tool({
        description: 'Look up an order by ID',
        inputSchema: z.object({ orderId: z.string() }),
        execute: async ({ orderId }) => ({
          orderId,
          status: 'Shipped',
          eta: '2 days',
          amountInr: 1499,
        }),
      }),
    },
    stopWhen: stepCountIs(5),
    prompt: 'Mera order ORD-9912 kahan hai? Update do please.',
  });

  console.log(result.text);
}

main().catch(console.error);
