/**
 * Next.js App Router — streaming chat API route.
 *
 * Save as: app/api/chat/route.ts
 * Requires: npm i ai krutrim-ai-sdk
 */
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { krutrim, indicResponsePrompt } from 'krutrim-ai-sdk';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: krutrim('Krutrim-2'),
    system: indicResponsePrompt('en-IN', { allowCodeMix: true }),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
