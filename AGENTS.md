<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Eleições 2026 — project notes

Voter-information site (pt-BR) for a São Paulo state voter: every 2026 candidate per
office, ordered right → left, names in red when there is a sourced "motivo de alerta".

- `data/raw/` official inputs (TSE DivulgaCand list + details, Câmara roll calls).
- `data/research/` curated research about living people. Every item needs a source URL
  that was actually opened, the exact legal status, and neutral wording. Same standard
  for every party. Never add an item from memory.
- `data/partidos.json` party scores (expert survey, 2022 wave).
- `npm run data:camara` refreshes roll calls; `npm run data:build` regenerates
  `src/data/*.json` (committed). Never edit `src/data` by hand.
- Rules for what turns a name red live in `src/app/como-funciona/page.tsx` — keep the
  page and `scripts/build-data.ts` in sync.

## Testing and shipping (dev-playbook)

This repo follows the dev-playbook (`~/.claude/skills/dev-playbook/PLAYBOOK.md`).

- One gate: `scripts/check` (lint + types + unit + build). The pre-push hook runs it
  (`git config core.hooksPath .githooks`). Never push with `--no-verify`.
- Bugs: write a failing regression test first, then fix.
- Never weaken, skip or delete a test to make it pass.
- UI changes: run the Playwright e2e and attach desktop (1280) + mobile (375)
  screenshots of every changed screen to the PR or final message.
- Risk class for this repo: none for code; the *content* is sensitive (claims about
  living people). Changes to `data/research/` need a source check, and
  `tests/dados.test.ts` must keep asserting that every red name has a sourced reason.
- External APIs: always mocked in tests.
- No real paths, IPs, passwords or tokens in code, tests, fixtures or docs.
- Before finishing: run `/code-review` on the diff, then give the evidence package:
  summary, risk class, test results, screenshots, rollback steps.
