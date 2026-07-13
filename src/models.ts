/**
 * Popular chat / text-generation model IDs on Krutrim Cloud.
 *
 * Exact IDs can change as the catalogue is updated — always confirm in the
 * [Model Catalogue](https://cloud.olakrutrim.com) if a call fails with
 * "invalid model".
 *
 * Free-form strings are still accepted via `ChatModelId`.
 */
export const KRUTRIM_CHAT_MODELS = {
  /** Krutrim's flagship Indic-capable model (v1). */
  krutrim1: 'Krutrim-1',
  /** Krutrim's next-generation text model. */
  krutrim2: 'Krutrim-2',
  /** Lowercase alias accepted by many OpenAI-compatible samples. */
  krutrim1Lower: 'krutrim-1',
  krutrim2Lower: 'krutrim-2',

  // Open models commonly hosted on Krutrim Cloud
  llama33_70b: 'Llama-3.3-70B-Instruct',
  llama32_11b_vision: 'Llama-3.2-11B-Vision-Instruct',
  llama4_maverick: 'Llama-4-Maverick-17B-128E-Instruct',
  llama3_8b: 'Meta-Llama-3-8B-Instruct',
  mistral7b: 'Mistral-7B-v0.2',
  mistral7bInstruct: 'Mistral-7B-Instruct',
  qwen3_32b: 'Qwen3-32B',
  qwen3_30b: 'Qwen3-30B-A3B',
  phi4_reasoning: 'Phi-4-reasoning-plus',
  deepseekR1: 'DeepSeek-R1',
  deepseekR1_70b: 'DeepSeek-R1-Distill-Llama-70B',
  deepseekR1_8b: 'DeepSeek-R1-Distill-Llama-8B',
  gemma3_27b: 'gemma-3-27b-it',
  spectreV2: 'Krutrim-spectre-v2',
} as const;

/**
 * Embedding model IDs (text-to-embedding).
 */
export const KRUTRIM_EMBEDDING_MODELS = {
  /** Krutrim embedding model. */
  vyakyarth: 'Vyakyarth',
  /** Alternative Krutrim embedding model. */
  bhasantarit: 'Bhasantarit',
} as const;

/**
 * Speech model IDs.
 */
export const KRUTRIM_SPEECH_MODELS = {
  /** Krutrim Speech-to-Text. */
  dhwani: 'Krutrim-Dhwani',
  /** Krutrim Text-to-Speech. */
  tts: 'Krutrim-TTS',
} as const;

/**
 * Multimodal / vision model IDs.
 */
export const KRUTRIM_VISION_MODELS = {
  chitrapathak: 'chitrapathak',
  llama32_11b_vision: 'Llama-3.2-11B-Vision-Instruct',
  llama4_maverick: 'Llama-4-Maverick-17B-128E-Instruct',
  gemma3_27b: 'gemma-3-27b-it',
} as const;

/**
 * Friendly aliases → canonical catalogue model IDs.
 *
 * Use {@link resolveModelId} so `krutrim('krutrim-2')` and
 * `krutrim('Krutrim-2')` both work.
 */
export const MODEL_ALIASES: Record<string, string> = {
  // Native Krutrim
  krutrim: 'Krutrim-2',
  'krutrim-1': 'Krutrim-1',
  'krutrim-2': 'Krutrim-2',
  krutrim1: 'Krutrim-1',
  krutrim2: 'Krutrim-2',
  'Krutrim-1': 'Krutrim-1',
  'Krutrim-2': 'Krutrim-2',

  // Speech
  dhwani: 'Krutrim-Dhwani',
  'krutrim-dhwani': 'Krutrim-Dhwani',
  'Krutrim-Dhwani': 'Krutrim-Dhwani',
  tts: 'Krutrim-TTS',
  'krutrim-tts': 'Krutrim-TTS',
  'Krutrim-TTS': 'Krutrim-TTS',

  // Embeddings
  vyakyarth: 'Vyakyarth',
  Vyakyarth: 'Vyakyarth',
  bhasantarit: 'Bhasantarit',
  Bhasantarit: 'Bhasantarit',

  // Common open-model shortcuts
  'llama-3.3-70b': 'Llama-3.3-70B-Instruct',
  'llama3.3-70b': 'Llama-3.3-70B-Instruct',
  'llama-3.2-11b-vision': 'Llama-3.2-11B-Vision-Instruct',
  'mistral-7b': 'Mistral-7B-v0.2',
  'deepseek-r1': 'DeepSeek-R1',
  'qwen3-32b': 'Qwen3-32B',
  'phi-4': 'Phi-4-reasoning-plus',
};

/**
 * Resolve a friendly alias or passthrough an exact catalogue ID.
 */
export function resolveModelId(modelId: string): string {
  return MODEL_ALIASES[modelId] ?? MODEL_ALIASES[modelId.toLowerCase()] ?? modelId;
}

/**
 * Typed chat model IDs with autocomplete for popular models.
 */
export type ChatModelId =
  | (typeof KRUTRIM_CHAT_MODELS)[keyof typeof KRUTRIM_CHAT_MODELS]
  | keyof typeof MODEL_ALIASES
  | (string & {});

/**
 * Typed embedding model IDs.
 */
export type EmbeddingModelId =
  | (typeof KRUTRIM_EMBEDDING_MODELS)[keyof typeof KRUTRIM_EMBEDDING_MODELS]
  | (string & {});

/**
 * Typed speech model IDs.
 */
export type SpeechModelId =
  | (typeof KRUTRIM_SPEECH_MODELS)[keyof typeof KRUTRIM_SPEECH_MODELS]
  | (string & {});
