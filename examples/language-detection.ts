/**
 * Bhashik language detection.
 *
 *   npx tsx --env-file=.env examples/language-detection.ts
 */
import { generateText } from 'ai';
import { krutrim } from '../src';

async function main() {
  const samples = [
    'आज मौसम बहुत सुहाना है।',
    'എന്തൊരു മനോഹരമായ ദിവസം!',
    'How is the weather in Chennai?',
  ];

  for (const prompt of samples) {
    const { text } = await generateText({
      model: krutrim.languageDetection(),
      prompt,
    });
    console.log(`${prompt} → ${text}`);
  }
}

main().catch(console.error);
