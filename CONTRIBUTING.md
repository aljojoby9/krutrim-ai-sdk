# Contributing to krutrim-ai-sdk

Thanks for taking an interest in this project.

I maintain **krutrim-ai-sdk** as a focused TypeScript provider for the Vercel AI SDK and Krutrim Cloud. Small, well-scoped PRs with clear intent are appreciated.

## Quick start

```bash
git clone https://github.com/aljojoby9/krutrim-ai-sdk.git
cd krutrim-ai-sdk
npm install
cp .env.example .env   # optional, for live examples
npm test
npm run build
```

## Development workflow

1. **Open an Issue first** for larger features or API changes.
2. **Fork** and create a branch: `feat/…`, `fix/…`, `docs/…`.
3. Keep changes focused — one concern per PR.
4. Add or update tests under `tests/` when behavior changes.
5. Run locally:

```bash
npm run type-check
npm test
npm run build
```

6. Open a PR with a clear description (what / why / how tested).

## Project layout

```
src/
  provider.ts          # createKrutrim + default export
  chat/                # LanguageModelV3 (main path)
  embedding/           # embeddings
  bhashik/             # speech, STT, LID, translation
  indic/               # languages + prompt helpers
  models.ts            # catalogue IDs + aliases
  error.ts             # India-aware error enrichment
examples/              # demos
tests/                 # vitest
```

## Coding guidelines

- **TypeScript strict** — no `any` unless unavoidable and commented.
- **JSDoc** on public exports users will see in IDE hover.
- **Minimal deps** — prefer `@ai-sdk/provider` / `provider-utils` primitives.
- **Match AI SDK conventions** — look at `@ai-sdk/openai` and similar providers for patterns.
- **Don't break the call signature** `krutrim('model')` without a major version.
- **Indic helpers** stay lightweight (prompts/types) — don't pull heavy NLP libraries.

## Testing

- Unit tests with **vitest** (mock `fetch` for network).
- Prefer pure tests for aliases, errors, and Indic helpers.
- Live/integration tests (optional): keep behind env keys; never commit secrets.

```bash
npm test
npm run test:watch
```

## Docs

- User-facing behavior changes → update **README.md**.
- Releases → note in **CHANGELOG.md**.

## Reporting bugs

Include:

- Package version (`krutrim-ai-sdk`, `ai`)
- Model ID
- Minimal reproduction
- Runtime (Node, Edge, Bun, browser)
- Redacted error message (no API keys)

## Security

Do **not** open public issues for vulnerabilities. See [SECURITY.md](./SECURITY.md).

## Code of conduct

Be respectful. See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## License

By contributing, you agree your contributions are licensed under the **MIT License**.
