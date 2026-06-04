# AGENTS.md — @uploadcare/cdn-url

Rules for AI agents (and humans) working on this package. The package lives in
the `uploadcare-js-api-clients` monorepo but deliberately diverges from its
conventions in several ways — do not "fix" these divergences.

## Tooling: oxc only

- **This package uses `oxlint` + `oxfmt`, NOT eslint/prettier.** The root
  monorepo eslint/prettier explicitly ignore `packages/cdn-url` (see root
  `.eslintignore` / `.prettierignore`). Never add eslint or prettier
  configs/deps here, and never remove the root ignore entries.
- Lint: `npm run lint` — **type-aware** oxlint (`oxlint --type-aware`, backed by
  the `oxlint-tsgolint` devDep; needs `tsconfig.json`). Format: `npm run format`
  (oxfmt). Style is prettier-config-standard-compatible: no semicolons, single
  quotes, 80 cols.
- `tsconfig.json` sets `noUncheckedIndexedAccess: true` — indexed access is
  `T | undefined`. Guard it (`?.[i]`, `=== undefined` checks); do **not** reach
  for `as` casts — type-aware lint rejects unnecessary/unsafe assertions. The
  only sanctioned `no-unsafe-type-assertion` disable is the single `Partial<S>`
  cast in `fluent/chain-base.ts` (generic immutable-builder plumbing).
- In markdown docs, never write bare array expression statements in code
  examples (`;[preview()]`) — oxfmt adds ASI-guard semicolons that look broken
  to readers. Assign to a `const` instead.

## Architecture invariants

- **No code in barrel (`index.ts`) files** — barrels re-export only.
- **Functional core, facades on top.** `parse.ts` / `serialize.ts` /
  `grammar.ts` / `operation-ref.ts` are the core. The `builder` (CdnUrl class)
  and `fluent` (`cdn` mega-object) entries wrap it; they must never grow logic
  the core doesn't have.
- **`ParsedCdnUrl` is a discriminated union** (`kind: 'file' | 'group' |
'group-element' | 'proxy'`). Each member carries only the fields its kind
  allows (group roots have no `operations`, proxies no `uuid`/`search`).
- **Round-trip law:** `serializeCdnUrl(parseCdnUrl(url)) === url` for every
  valid CDN URL. The parser is lenient: unknown operations (incl. `@`-prefixed
  internal ones like `@clib`) pass through verbatim. Never make the parser
  reject unknown operations.
- **Operation creators are strict** (ranges/enums/grammar), wrapped in
  `namedOp('cdn_name', fn)` so the creator itself works as an `OperationRef`
  (`url.without(resize)`). Aliased creators map to their real directive:
  `cropByRatio.opName === 'crop'`.
- **The `/* @__PURE__ */` annotations on `namedOp(...)` calls are
  load-bearing.** Removing them breaks consumer tree-shaking (measured: a
  single-creator import grows from ~0.5 kB to ~4.6 kB). Keep them on every
  creator definition.

## Dual bundles (`__DEV__`)

- One source, two flavors: dev (validation throws) and prod (checks stripped
  by DCE), selected via `development`/`production` export conditions; prod is
  the default. The IIFE global build (`dist/cdn-url.global.js`,
  `window.UCCdnUrl`) is a third, prod-flavored artifact.
- Guard **assertions** with `if (__DEV__ && …) throw`; in prod the contract is
  garbage-in/garbage-out. **Structural errors stay in both bundles**:
  `parseCdnUrl`, `parseGroupId`, `serializeCdnUrl`'s addressing guard — code
  relies on them for control flow.
- Builder/fluent misuse guards (ops on a group root, filename on a proxy)
  throw in dev and become safe no-ops (`return this`) in prod — the no-op
  branch is also what satisfies TypeScript narrowing.
- The `validate` entry (`validateOperations`) must stay fully functional in
  BOTH bundles — it is opt-in API, not a dev check.
- `scripts/verify-bundles.mjs` + `scripts/smoke-node.mjs` run as part of
  `npm run build` and will fail the build if flavors regress.

## Domain knowledge (hard-won, don't re-litigate)

- **`ucarecd.net` is NOT a typo.** It's the prefixed per-project CDN zone,
  distinct from legacy `ucarecdn.com`. Two doc reviewers independently
  "corrected" it; both were wrong.
- **Video and document conversions are PATHS, not URLs** —
  `/​:uuid/video/-/…/` strings submitted to the REST convert API
  (`videoPath`/`documentPath`, no domain). `gif2video` is the exception: an
  on-the-fly CDN URL. Conversion prefixes attach with a plain `/`, no `-/`.
- **`format/auto` is applied by the CDN by default** whenever the chain
  contains any processing operation; **adaptive quality** is default for
  projects created ≥ 2025-08-04. Docs/examples must NOT prescribe
  `format('auto') + quality('smart') + progressive(true)` boilerplate — one
  core operation (`preview`/`resize`/`smart_resize`/`scale_crop`) unlocks the
  defaults. `progressive` affects only the JPEG fallback path.
- **Video `thumbs` serializes as `thumbs~N`** (name carries the count).
  Matching by ref handles this via the `name~` prefix rule in
  `operationMatches`. Bare `thumb`/`thumbs` are NOT valid operations.
- The engine's exact accept/reject rules live in the private
  `uploadcare/actions_dsl` repo (inaccessible). The public docs are the spec.
- **Docs source of truth is `uploadcare/fern-docs`** — `uploadcare/docs` is
  legacy; never cite it.
- Secure-delivery tokens (`?token=…`) are preserved through parse/serialize
  but never generated here; editing operations invalidates an existing
  signature.

## Testing & verification

TDD is the norm here: tests first, then implementation. Before claiming done:

```sh
npm test                 # vitest, node env (__DEV__: true)
npm run test:browser     # same suite in real Chromium (playwright)
npx tsc                  # type-check (noEmit; vite-plugin-dts emits types)
npm run lint             # oxlint
npm run build            # dual+IIFE build, bundle verify, node smoke (44 checks)
npm run docs:api         # typedoc — FAILS on any undocumented public symbol
```

- The vitest config defines `__DEV__: true`; tests assert dev-bundle throwing.
  Bundle-flavor differences are covered by the build-time scripts, not vitest.
- Type-level guarantees are tested with `@ts-expect-error` (e.g. image ops
  absent on video chains). Use `void expr` for such probes (oxlint
  no-unused-expressions).

## Docs site (VitePress + TypeDoc)

- `docs/` is a VitePress site; `docs/reference/` is generated by TypeDoc
  (markdown plugin + vitepress theme) — never edit `docs/reference/**` by
  hand; it's gitignored.
- **JSDoc coverage is enforced**: `docs:api` runs typedoc with
  `--treatValidationWarningsAsErrors`. Every exported symbol, property and
  method needs a docblock, with `@see` links to the relevant
  uploadcare.com/docs page and an `@example` showing the exact output.
- Two base paths: default builds for GitHub Pages
  (`/uploadcare-js-api-clients/cdn-url/`); `DOCS_BASE=/ vitepress build docs`
  builds for the Firebase mirror (`uc-cdn-url.web.app`). Firebase deploys are
  staged from `/tmp` — **never commit firebase configs to the repo**.
- VitePress fails builds on dead internal links — build from the package root
  (`npx vitepress build docs`), not from inside `docs/`.
- Docs pages are reader-tested: when adding substantial pages, verify them
  with a fresh-context agent answering realistic questions from the prose
  alone.

## Monorepo integration

- Registered in root `package.json` `workspaces` and `ship.config.mjs`
  `packagesToPublish`. Version is synced by ship-js (currently in lockstep
  with the monorepo); no `src/version.ts` here.
- `files: ["dist", …]` in package.json — do not change to `dist/*` (npm glob
  would drop the nested `dist/dev|prod|types` trees from the tarball).
- New entry points require updates in FIVE places: `vite.config.js` entries,
  `package.json` exports (types + development + production + defaults),
  `typedoc.json` entryPoints, `scripts/smoke-node.mjs` entries list, and the
  docs entry-points table in `docs/guide/getting-started.md`.
