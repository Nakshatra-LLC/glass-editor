# Contributing to @nakshatra.io/clean-editor

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
  `<CleanEditor>` with a mock AI adapter so you can click around.

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

## Releasing

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing.

- When a version bump lands (via the Changesets 'Version Packages' PR), also update the `VERSION` constant in `src/index.ts` to match `package.json` — they must stay in sync.

**Contributors:** add a changeset for every PR that changes behaviour:

```bash
pnpm changeset   # prompts for bump type + summary; creates a .changeset/*.md file
```

Commit the generated `.changeset/*.md` file with your PR. The changesets/action CI bot will open a "Version Packages" PR that rolls up all pending changesets into a version bump + CHANGELOG update. Merging that PR triggers the actual npm publish.

**First-time maintainer setup:**

Publishing uses **npm Trusted Publishing (OIDC)** — there is **no `NPM_TOKEN` secret**. CI authenticates to npm via GitHub's OIDC identity.

1. Confirm the `@nakshatra.io` npm scope exists and is public.
2. On npm, open the package → **Settings → Trusted Publisher → GitHub Actions** and set: org/user `Nakshatra-LLC`, repository `clean-editor`, workflow filename `release.yml`, allowed action **`npm publish`** (leave Environment empty to match the workflow).
3. Enable GitHub Actions write permissions: Settings → Actions → General → Workflow permissions → "Read and write permissions".

The release workflow already requests `id-token: write` and sets `NPM_CONFIG_PROVENANCE=true`, so published versions carry signed provenance automatically.

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT License](LICENSE).

## Backlog / where to help

These are deliberately left for v2 / community contributions. Each should build
on the existing hooks (`slashItems`, `bubbleItems`, `extensions`, theme
variables) without changing the core. Browse
[issues labeled `help wanted` / `good first issue`](https://github.com/Nakshatra-LLC/clean-editor/issues)
to claim one (open an issue first if it doesn't exist):

- **Block-actions menu (M2/M3)** — the grip already drags to reorder (shipped in
  0.2.0 via the MIT `@tiptap/extension-drag-handle-react`). The next step is a
  grip-**click** menu: Turn Into, Duplicate, Color, Delete, Ask AI. See the
  [spec](docs/superpowers/specs/2026-06-22-drag-handle-and-gutter-plus-design.md#future-milestones).
- **Rich AI selection menus** — Adjust Tone, Fix grammar, Make longer/shorter,
  Simplify, Emojify, Summarize, Translate — all as `bubbleItems` / `slashItems`
  that call `ai.ask` with preset instructions.
- **Slash filtering polish** — fuzzy match, recents, per-group ordering.
- **Markdown import/export** and **image upload** helpers.
