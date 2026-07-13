# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-07-13

### Added

- Initial public release of **krutrim-ai-sdk**
- `createKrutrim` / default `krutrim` provider for Vercel AI SDK v6
- Chat completions: `generateText`, `streamText`, tool calling, structured output path
- OpenAI-compatible client for `https://cloud.olakrutrim.com/v1`
- API key via `KRUTRIM_API_KEY` or `KRUTRIM_CLOUD_API_KEY`
- Model aliases and exports (`KRUTRIM_CHAT_MODELS`, `resolveModelId`, …)
- Embedding models (`embedding` / `textEmbeddingModel`)
- Lightweight Bhashik helpers: speech (TTS), transcription (STT), language detection, translation
- Indic helpers: `indicResponsePrompt`, `transliterationNotes`, `indicSupportAgentPrompt`, language maps
- India-aware error enrichment (rate limits, INR credits, region, invalid model)
- Examples, tests, MIT license, contributing docs

[0.1.0]: https://github.com/aljojoby9/krutrim-ai-sdk/releases/tag/v0.1.0
