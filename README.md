# krutrim-ai-sdk

<p align="center">
  <strong>Vercel AI SDK provider for <a href="https://cloud.olakrutrim.com">Krutrim Cloud</a></strong><br/>
  India's sovereign AI — with DX Indian developers actually enjoy.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/krutrim-ai-sdk"><img src="https://img.shields.io/npm/v/krutrim-ai-sdk.svg?color=cb3837" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/krutrim-ai-sdk"><img src="https://img.shields.io/npm/dm/krutrim-ai-sdk.svg?color=blue" alt="npm downloads" /></a>
  <a href="https://github.com/aljojoby9/krutrim-ai-sdk/stargazers"><img src="https://img.shields.io/github/stars/aljojoby9/krutrim-ai-sdk?style=social" alt="GitHub stars" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="MIT License" /></a>
  <a href="https://ai-sdk.dev"><img src="https://img.shields.io/badge/AI%20SDK-v6-black" alt="AI SDK v6" /></a>
  <img src="https://img.shields.io/badge/Made%20in-India-FF9933?labelColor=138808" alt="Made in India" />
</p>

<p align="center">
  Chat · Streaming · Tools · Agents · Embeddings · Indic helpers · Bhashik speech<br/>
  <code>npm i krutrim-ai-sdk ai@6</code>
</p>

---

## Why this exists

Krutrim Cloud already has an **OpenAI-compatible** API. You *can* point the raw OpenAI client at `https://cloud.olakrutrim.com/v1` and ship.

Building real products needs more:

- **First-class Vercel AI SDK support** — `generateText`, `streamText`, tools, structured output, Next.js streaming — not a second-class fork of `openai`
- **Model aliases that stick** — `krutrim-2` → `Krutrim-2`, without hunting catalogue strings
- **Indic-native defaults** — Hindi/Tamil/Malayalam system prompts, Hinglish notes, support-agent presets, ₹/INR-aware errors
- **Clear failure modes** — rate limits, credits, region, bad keys — explained for Indian builders, not generic US SaaS copy

I built **krutrim-ai-sdk** so Krutrim works with the same DX as other AI SDK providers (similar spirit to [sarvam-ai-sdk](https://github.com/sarvamai/sarvam-ai-sdk)): solid defaults, typed APIs, and production-ready ergonomics.

---

## Install (one command)

```bash
npm i krutrim-ai-sdk ai@6
```

```bash
pnpm add krutrim-ai-sdk ai@6
# or
yarn add krutrim-ai-sdk ai@6
# or
bun add krutrim-ai-sdk ai@6
```

Get an API key from the [Krutrim Cloud console](https://cloud.olakrutrim.com):

```bash
# .env — either name works
KRUTRIM_API_KEY=your_api_key_here
# KRUTRIM_CLOUD_API_KEY=your_api_key_here
```

---

## Quick start

### 1. Basic chat

```ts
import { krutrim } from 'krutrim-ai-sdk';
import { generateText } from 'ai';

const { text } = await generateText({
  model: krutrim('Krutrim-2'),
  prompt: 'नमस्ते! मुंबई के बारे में एक मज़ेदार तथ्य बताओ।',
});

console.log(text);
```

### 2. Streaming

```ts
import { streamText } from 'ai';
import { krutrim } from 'krutrim-ai-sdk';

const result = streamText({
  model: krutrim('Krutrim-2'),
  prompt: 'Write a short poem about the Indian monsoon.',
});

for await (const delta of result.textStream) {
  process.stdout.write(delta);
}
```

### 3. Next.js App Router

`app/api/chat/route.ts`:

```ts
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
```

Wire any AI SDK UI (`useChat`) to `POST /api/chat`.

### 4. Agent with tools

```ts
import { generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { krutrim, indicSupportAgentPrompt } from 'krutrim-ai-sdk';

const result = await generateText({
  model: krutrim('Krutrim-2'),
  system: indicSupportAgentPrompt({
    brandName: 'MyApp',
    languages: ['hi-IN', 'en-IN', 'ta-IN'],
  }),
  tools: {
    lookupOrder: tool({
      description: 'Look up an order by ID',
      inputSchema: z.object({ orderId: z.string() }),
      execute: async ({ orderId }) => ({
        orderId,
        status: 'Shipped',
        amountInr: 1499,
      }),
    }),
  },
  stopWhen: stepCountIs(5),
  prompt: 'Mera order ORD-9912 kahan hai?',
});

console.log(result.text);
```

### 5. Custom provider config

```ts
import { createKrutrim } from 'krutrim-ai-sdk';

const krutrim = createKrutrim({
  apiKey: process.env.KRUTRIM_API_KEY,
  baseURL: 'https://cloud.olakrutrim.com/v1',
  headers: { 'X-App-Name': 'my-app' },
});
```

---

## Supported models

IDs follow the [Krutrim Model Catalogue](https://docs.cloud.olakrutrim.com/basics/ai-studio/model-catalogue). Confirm in the console if a call returns “invalid model”.

### Native Krutrim (highlight)

| Model | ID | Modality |
| ----- | -- | -------- |
| **Krutrim-2** | `Krutrim-2` / alias `krutrim-2` | Text ★ default pick |
| **Krutrim-1** | `Krutrim-1` / alias `krutrim-1` | Text |
| **Krutrim-Dhwani** | `Krutrim-Dhwani` | Speech-to-Text |
| **Krutrim-TTS** | `Krutrim-TTS` | Text-to-Speech |
| **Vyakyarth** | `Vyakyarth` | Embeddings |
| **Bhasantarit** | `Bhasantarit` | Embeddings |
| **chitrapathak** | `chitrapathak` | Vision / image-text |

### Popular hosted open models

| Model | ID |
| ----- | -- |
| Llama 3.3 70B | `Llama-3.3-70B-Instruct` |
| Llama 3.2 11B Vision | `Llama-3.2-11B-Vision-Instruct` |
| DeepSeek R1 | `DeepSeek-R1` |
| Qwen3 32B | `Qwen3-32B` |
| Mistral 7B | `Mistral-7B-v0.2` |
| Phi-4 Reasoning | `Phi-4-reasoning-plus` |
| Gemma 3 27B | `gemma-3-27b-it` |

```ts
import { KRUTRIM_CHAT_MODELS, resolveModelId } from 'krutrim-ai-sdk';

krutrim(KRUTRIM_CHAT_MODELS.krutrim2);
resolveModelId('deepseek-r1'); // → "DeepSeek-R1"
```

---

## krutrim-ai-sdk vs raw OpenAI SDK

| | OpenAI SDK pointed at Krutrim | **krutrim-ai-sdk** |
| - | ----------------------------- | ------------------ |
| Works with AI SDK `generateText` / `streamText` | Manual / wrappers | ✅ native |
| Next.js UI message streaming | DIY | ✅ `toUIMessageStreamResponse` |
| Tool calling + agents | DIY mapping | ✅ first-class |
| Model aliases (`krutrim-2`) | ❌ | ✅ |
| Indic system prompts | ❌ | ✅ `indicResponsePrompt`, etc. |
| INR / rate-limit error tips | Generic | ✅ India-aware |
| Embeddings + Bhashik helpers | Separate clients | ✅ same package |
| Dependencies | `openai` client | Minimal (`@ai-sdk/*`) |

You still use Krutrim’s OpenAI-compatible endpoint under the hood — this package is the **AI SDK-shaped door** into it.

---

## Indic helpers 🇮🇳

```ts
import {
  indicResponsePrompt,
  transliterationNotes,
  indicSupportAgentPrompt,
  INDIC_LANGUAGES,
} from 'krutrim-ai-sdk';

// Force native-script Hindi answers
indicResponsePrompt('hi-IN');

// Hinglish / Romanized input awareness
transliterationNotes('hi-IN');

// Support agent: mirrors language, uses ₹ when relevant
indicSupportAgentPrompt({ brandName: 'PayApp' });
```

### Bhashik extras

```ts
// Language detection
await generateText({
  model: krutrim.languageDetection(),
  prompt: 'എന്തൊരു മനോഹരമായ ദിവസം!',
});

// Translation
await generateText({
  model: krutrim.translation({ from: 'hi-IN', to: 'en-IN' }),
  prompt: 'आज मौसम बहुत सुहाना है।',
});

// Embeddings
await embed({
  model: krutrim.embedding('Vyakyarth'),
  value: 'भारत की राजधानी नई दिल्ली है।',
});
```

---

## Version compatibility

| krutrim-ai-sdk | Vercel AI SDK |
| -------------- | ------------- |
| **0.1.x** (current) | **6.x** |
| 0.2.x (planned) | 7.x |

> Same generation as [sarvam-ai-sdk](https://www.npmjs.com/package/sarvam-ai-sdk) `0.3.x` (AI SDK v6 / `LanguageModelV3`).

---

## API surface

```ts
import { krutrim } from 'krutrim-ai-sdk';

// Chat
krutrim('Krutrim-2');
krutrim.languageModel('Llama-3.3-70B-Instruct');
krutrim.chat('deepseek-r1');

// Embeddings
krutrim.embedding('Vyakyarth');
krutrim.textEmbeddingModel('Bhasantarit');

// Bhashik / Language Labs
krutrim.speech('hi-IN');
krutrim.transcription('ta-IN');
krutrim.languageDetection();
krutrim.translation({ from: 'hi-IN', to: 'en-IN' });
```

Base URL: `https://cloud.olakrutrim.com/v1`  
Docs: [Inferencing](https://docs.cloud.olakrutrim.com/basics/ai-studio/ai-jobs/inferencing) · [Model catalogue](https://docs.cloud.olakrutrim.com/basics/ai-studio/model-catalogue)

---

## Examples

| File | Demo |
| ---- | ---- |
| [`examples/generate-text.ts`](./examples/generate-text.ts) | Hindi chat |
| [`examples/stream-text.ts`](./examples/stream-text.ts) | Streaming |
| [`examples/tools.ts`](./examples/tools.ts) | Tool calling |
| [`examples/agent.ts`](./examples/agent.ts) | Multilingual agent |
| [`examples/structured-output.ts`](./examples/structured-output.ts) | Structured JSON |
| [`examples/embeddings.ts`](./examples/embeddings.ts) | Embeddings |
| [`examples/nextjs-app-router/route.ts`](./examples/nextjs-app-router/route.ts) | App Router |

```bash
cp .env.example .env
npm i
npx tsx --env-file=.env examples/generate-text.ts
```

---

## Roadmap

- [x] Chat completions (generate + stream)
- [x] Tool calling & structured output path
- [x] Model aliases + `models.ts` constants
- [x] Indic prompt helpers + India-aware errors
- [x] Embeddings (Vyakyarth / Bhasantarit)
- [x] Bhashik TTS / STT / LID / translation (lightweight)
- [ ] Official listing under AI SDK [community providers](https://ai-sdk.dev/providers/community-providers)
- [ ] Image generation helpers (diffusion / multimodal)
- [ ] AI SDK v7 (`LanguageModelV4`) track
- [ ] More integration tests + sample apps (chat UI, voice)

Vote with ⭐ and Issues — popular requests get prioritized.

---

## Contributing

PRs and issues are welcome. See **[CONTRIBUTING.md](./CONTRIBUTING.md)**.

```bash
npm i
npm run build
npm test
```

---

## Disclaimer

Unofficial project — not affiliated with or endorsed by Ola / Krutrim unless stated otherwise. Maintained by [aljojoby9](https://github.com/aljojoby9).

---

## Links

- [Krutrim Cloud](https://cloud.olakrutrim.com)
- [Krutrim docs](https://docs.cloud.olakrutrim.com)
- [Vercel AI SDK](https://ai-sdk.dev)
- [Custom provider guide](https://ai-sdk.dev/providers/community-providers/custom-providers)
- [Sarvam AI SDK (inspiration)](https://github.com/sarvamai/sarvam-ai-sdk)

## License

[MIT](./LICENSE) · © [aljojoby9](https://github.com/aljojoby9)
