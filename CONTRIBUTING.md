# Contributing to @nakshatra/glass-editor

Thanks for your interest in contributing! This guide covers the workflow. For the
deeper "how this codebase works" reference (architecture, guarded patterns, AI
rules), read **[AGENTS.md](AGENTS.md)** first.

## Prerequisites

- **Node** 18+ (developed on Node 24)
- **pnpm** (use the repo lockfile — never `npm` or `yarn`)

## Setup

```bash
pnpm install   # also installs git hooks via the prepare script
```

## Development loop

This is a library, so there is no app `dev` server. Two ways to work:

- **Tests (primary):** `pnpm test` (or `pnpm test --watch` locally). We practice
  **TDD** — write a failing test first, then the implementation.
- **Demo (interactive):** `pnpm demo` starts a local Vite app (`demo/`) that mounts
  `<GlassEditor>` with a mock AI adapter so you can click around.

## Before you commit

Git hooks enforce these automatically, but you can run them yourself:

```bash
pnpm typecheck   # tsc --noEmit
pnpm test        # full Vitest suite, output must be pristine
```

- **pre-commit** runs `typecheck` + `test`; a failure blocks the commit.
- **pre-push** runs `test` + `build`; a failure blocks the push.

Do not bypass hooks with `--no-verify` to skip failing tests.

## Guarded patterns

Some invariants are enforced by `src/guards.test.ts` (peer-dependency singletons,
OSS-only deps, zero domain coupling, stable public API). If a change trips one of
these tests, that is intentional friction: either fix your change, or — if the
change is deliberate — update the guard test and explain why in your PR. See
[AGENTS.md → Guarded patterns](AGENTS.md#guarded-patterns-do-not-break).

## Commits

- Use clear, conventional-ish messages (`feat:`, `fix:`, `docs:`, `chore:`, `test:`).
- Keep diffs single-purpose and small.
- **AI attribution is required.** Any commit produced with AI assistance must carry
  an attribution trailer naming the tool, e.g.:

  ```
  Assisted-By: Claude Code
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

  Name whichever assistant you used.

## Pull requests

1. Fork and branch from `main`.
2. Make your change with tests (TDD).
3. Ensure `pnpm typecheck`, `pnpm test`, and `pnpm build` all pass (CI runs them too).
4. Open a PR with a short description of the *why*. Fill out the PR template.
5. CI must be green to merge.

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT License](LICENSE).
