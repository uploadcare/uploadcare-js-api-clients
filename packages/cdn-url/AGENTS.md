# AGENTS.md — @uploadcare/cdn-url

Rules for AI agents (and humans) working on this package. The package lives in
the `uploadcare-js-api-clients` monorepo but deliberately diverges from its
conventions in several ways — do not "fix" these divergences.

## Tooling: oxc only

- **This package uses `oxlint` + `oxfmt`, NOT eslint/prettier.** The root
  monorepo eslint/prettier explicitly ignore `packages/cdn-url` (see root
  `.eslintignore` / `.prettierignore`). Never add eslint or prettier
  configs/deps here, and never remove the root ignore entries.
- Lint: `npm run lint` (`oxlint src`). **Type-aware linting is on** via
  `options.typeAware: true` in `.oxlintrc.json` (backed by the `oxlint-tsgolint`
  devDep), so bare `oxlint` and editor LSP integrations get it too — no CLI flag
  needed. Format: `npm run format` (oxfmt). Style is prettier-config-standard-compatible: no semicolons, single
  quotes, 80 cols.
- `tsconfig.json` sets `noUncheckedIndexedAccess: true` — indexed access is
  `T | undefined`. Guard it (`?.[i]`, `=== undefined` checks); do **not** reach
  for `as` casts — type-aware lint rejects unnecessary/unsafe assertions. The
  sanctioned `no-unsafe-type-assertion` disables are exactly three, each with its
  reason in the comment: the `Partial<S>` cast in `fluent/chain-base.ts` (generic
  immutable-builder plumbing), `unsafeOperation` in `literals.ts` (widening past the
  union is the feature) and `asModifiersChain` in the same file (applying a brand
  cannot be expressed without one — which is why every producer routes through that
  single function instead of casting locally). Do not add a fourth without the same
  kind of justification.
- In markdown docs, never write bare array expression statements in code
  examples (`;[preview()]`) — oxfmt adds ASI-guard semicolons that look broken
  to readers. Assign to a `const` instead.

## Architecture invariants

- **No code in barrel (`index.ts`) files** — barrels re-export only.
- **Functional core, facades on top.** `parse.ts` / `serialize.ts` /
  `grammar.ts` / `operation-ref.ts` are the core. The `builder` (CdnUrl class)
  and `fluent` (`base()` mega-object) entries wrap it; they must never grow logic
  the core doesn't have.
- **`ParsedCdnUrl` is a discriminated union** (`kind: 'file' | 'group' |
'group-element' | 'proxy'`). Each member carries only the fields its kind
  allows (group roots have no `operations`, proxies no `uuid`/`search`).
- **Per-kind parsers exist alongside `parseCdnUrl`**: `parseFileUrl`,
  `parseGroupUrl`, `parseGroupElementUrl`, `parseProxyUrl`, plus `isFileUrl`
  and friends. `parseCdnUrl` **delegates** to them, so the dispatch lives in
  one place and cannot drift; a test asserts all five agree on every fixture.
  They exist for bundle size: importing `parseFileUrl` alone is 714 B gzipped
  against 1078 B for `parseCdnUrl`. They are exported from the **root entry**,
  not a new entry point — per-symbol tree-shaking already gives the saving, so
  do not add an entry for them.
- **Per-kind serializers mirror them**: `serializeFileUrl`, `serializeGroupUrl`,
  `serializeProxyUrl`, with `serializeCdnUrl` **delegating** to the three for the
  same anti-drift reason. Measured on a file-only consumer that parses and
  serializes: 903 → 748 B brotli (2171 → 1682 raw) versus using the dispatcher.
  One group serializer covers both root and element because both come from a
  single `GroupUrlInput` — a root is the same url without `nth`. The round-trip
  corpus runs through the per-kind functions as well as the dispatcher, which is
  what makes it safe for a caller to import only one.
- **Write the uuid grammars as regex literals, never `new RegExp`.** esbuild will
  not eliminate a `new RegExp(...)` call even when marked `/* @__PURE__ */`, so
  composing `UUID_RE`/`GROUP_ID_RE` from a shared source string left the unused
  group regex in file-only bundles (verified: 172 → 110 B in a minimal repro).
  Literals are side-effect-free, so an unused one drops. The trade is that the
  uuid pattern is written twice; `grammar.test.ts` pins that the two agree, so a
  change to one fails until it is made to both. (`join_vars: false` was measured
  as an alternative to all this and does not help.)
- **Round-trip law:** `serializeCdnUrl(parseCdnUrl(url)) === url` for every
  valid CDN URL. The parser is lenient: unknown operations (incl. `@`-prefixed
  internal ones like `@clib`) pass through verbatim. Never make the parser
  reject unknown operations.
- **`parseOperations` is lenient about shape, the URL parsers are not.** A bare
  modifiers string may omit the leading `-` marker and carry surrounding slashes
  or whitespace (`'resize/300x'`, `'/resize/300x/'`, `'  -/resize/300x/  '`),
  because callers get these values from config, DOM attributes and stored
  `cdnUrlModifiers` alike. Operations within a chain are still `-`-separated, so
  `resize/300x/-/blur/10` stays unambiguous. The trade is deliberate: almost any
  slash-shaped string now parses, so `parseOperations` accepts a malformed chain
  rather than diagnosing it. Keep this leniency **local to `parseOperations`** —
  inside a URL a non-`-` segment is a filename or an error, and loosening the
  shared segment parser would make `/<uuid>/garbage/` parse `garbage` as an
  operation.
- **`updateOperations(fn)` is the one operation mutator on both facades**;
  `with`/`without`/`replace`/`replaceAll` (and the fluent `*Op` variants) are
  sugar over it. It hands the callback a defensive copy. Conversion chains
  (`video`/`document`/`gif2video`) emit a `.path` and `cdn.parse` only re-enters
  file/group/group-element/proxy urls, so `updateOperations` is their **only**
  edit path — don't remove it thinking the chain methods cover everything.
- **The string level is reachable from two import paths on purpose.** `/tiny` is a
  registered entry point (the docs use it, since it names the contract) and the same
  symbols are re-exported from the root entry for callers who already import from
  there. It costs nothing: a consumer naming only `tinyParse`/`tinyBuild`/`modifiers`
  bundles 347 B brotli through the root against 348 B through `/tiny`. Do not remove
  either path — and remember the root entry's own "import everything" figure carries
  them (2.0 kB gzipped rather than 1.7 kB), which is what the table in
  `functional-vs-builder.md` reports.
- **`src/tiny/` holds the string-level API — `literals.ts` (the chain: `modifiers`,
  `normalizeModifiers`, `joinModifiers`, the `ModifiersChain` brand) and
  `url.ts` (`tinyParse`/`tinyBuild`/`TinyFileUrl`). One folder because they are one
  story: the zero-machinery path for callers who cannot spend bytes. Both are
  re-exported from the **root entry**, not a new entry point — per-symbol
  tree-shaking already gives the saving.**
- **One fluent export, `cdn`, and it starts without a host.** `UnboundCdn` carries
  only the starters that need no base — `video`/`document` (paths, no host by
  design), `proxy` (the endpoint is an argument) and `parse` (the url carries its
  own) — plus `base`, which returns the full `Cdn`. `file`, `group` and
  `gif2video` exist only on that bound object, so a missing base is a **compile**
  error (`Property 'file' does not exist on type 'UnboundCdn'`). The unbound
  object still carries throwing stubs for those three, so a JavaScript caller gets
  a message naming `base` rather than `undefined is not a function`; that
  throw is structural and fires in **both** bundle flavors. Two interfaces rather
  than a conditional-typed `Cdn<Bound>`: the error message is legible and no `as`
  cast is needed to build the objects.
  A base is required because no host works for every project — a bare
  `ucarecd.net` does **not** resolve (only `<prefix>.ucarecd.net` does), so the one
  fallback a JS caller can reach is `LEGACY_CDN_BASE` (`ucarecdn.com`), which does
  serve unprefixed. Never reintroduce a bare-`ucarecd.net` default. This API was
  `configure({...})`, then `base(cdnBase)`, then `createCdn(cdnBase)`; all are
  gone. Do not add a second way in.
- **`base` is the one name for "same thing, different host"** — on the fluent
  entry object, on every chain, and on the builder. `ProxyChain.proxy` is the
  single exception, because its argument is a `*.ucr.io` endpoint and not a CDN
  base, a distinction the guide teaches; the method name must not blur it.
- **Both facades name mutators after the thing, not with a verb**: `base()`,
  `proxy()`, `filename()`. The builder's `setCdnBase`/`setFilename` and the
  chains' `on()` are gone, so `CdnUrl` now reads like a chain. The `*Op` family
  (`withOp`, `withoutOp`, `replaceOp`, `getOp`, …) stays suffixed and chain-only:
  there the bare names would collide with transformation methods, which is the one
  place the two facades cannot align.
- **Every object the fluent entry hands out is frozen, and `Cdn`/`UnboundCdn`
  members are `readonly`** (property syntax, not method syntax — methods cannot be
  `readonly`). Chains were already immutable; this stops a consumer
  monkey-patching a shared entry point.
- **The prefixed-base helpers are re-exported from every entry that takes a base**
  — root, `fluent`, `builder`, `group`, `proxy`, `gif2video`, `tiny` — alongside
  `LEGACY_CDN_BASE`/`PREFIX_CDN_BASE`. All resolve to the same module, so a bundle
  never duplicates them and nobody pays unless they name one. `ops`, `video`,
  `document` and `validate` deliberately do **not**: no base is involved there, and
  `videoPath`/`documentPath` returning host-free paths is something the docs state
  plainly.
- **`prefixedCdnBaseAsync` is the browser-preferred helper, `prefixedCdnBase` the
  server one.** The async path uses WebCrypto and adds ~221 B brotli to a browser
  bundle; the sync path must carry a SHA-256 there (~946 B) because no synchronous
  code can wait for a promise, and under Node it resolves to `node:crypto` (~151
  B). Async rejects under Node by design. Re-measure rather than copying these
  forward.
- **`prefixedCdnBase(publicKey, cdnBase = PREFIX_CDN_BASE)` is the only prefix
  path, and it is deliberately manual.** It wraps `getPrefixedCdnBaseSync` from
  `@uploadcare/cname-prefix` (the package's first and only runtime dependency),
  defaulting the zone and trimming a trailing slash. Nothing prefixes on the
  caller's behalf — an earlier draft gave `configure` a `publicKey` option and it
  was **removed**: it welded 4.7 kB of SHA-256 (2.1 kB gzipped) into every fluent
  consumer's bundle. Kept in its own module (`src/prefixed-cdn-base.ts`, its own
  dist chunk), it drops for anyone who doesn't name it: `fluent` measures 19.8 kB
  min / 6.6 kB gz with it and 15.0 / 4.4 without. The figures in
  `functional-vs-builder.md` are those; re-measure rather than copy them forward.
- **One word for the host: `cdnBase`.** `origin` was renamed out of the whole
  package — `ParsedCdnUrl.cdnBase`, `FileUrlInput.cdnBase`, `TinyFileUrl.cdnBase`,
  `CdnUrl.base`, every helper's first argument. It matches
  `@uploadcare/cname-prefix` and the uploader's own config vocabulary. `origin`
  now only ever means the Web API (`new URL(x).origin`) — do not let it back in as
  a field name, and do not add a second synonym for `cdnBase` either.
- **Vocabulary, used consistently everywhere:** an _operation_ is one directive
  (`resize/300x`, or `{ name, params }` as data); _modifiers_ are the whole
  serialized run of them (`-/resize/300x/-/blur/10/`), which is the word Uploadcare's
  own API uses (`cdnUrlModifiers`). So `modifiers()` takes operations and returns
  modifiers, `parseOperations` goes the other way, and a `modifiers` field is always
  the whole chain. Both guide pages define this; do not let a third word ("chain"
  as a type name aside, "directives", "transformations") drift in as a synonym.
- **`tiny/` is single-file urls only.** `TinyFileUrl` names it, the fields mirror
  `ParsedFileUrl` (`cdnBase`/`uuid`/`filename`/`search`/`hash`, with `modifiers`
  standing in for `operations`), and everything but `cdnBase`/`uuid` is optional so
  `tinyBuild` builds from scratch. Groups, group elements and proxy urls round-trip
  untouched but produce meaningless fields — documented, not guarded, because
  guarding is what costs the bytes. **A conversion result is a file url too**
  (`isFileUrl` returns true for `/:uuid/gif2video/…`) and its prefix lands in
  `modifiers`, so replacing the chain drops the conversion; appending is safe.
- **A trailing slash on `cdnBase` is tolerated by every entry that takes one** —
  serializers, the builder and its `base`, `configure`, every chain's `on()`,
  the group/proxy/gif2video helpers and `tinyBuild`. Config files and
  `new URL(x).origin` both produce them. The trimming is `trimTrailingSlashes`, but
  each entry has to call it, so `cdn-base.test.ts` pins the whole matrix (bare, one
  slash, three slashes) rather than trusting the next cdnBase-accepting function to
  remember. Add a row there when you add one.
- **`tiny/` normalizes almost nothing on the way in, and the guide says so.** The one
  exception is the trailing slash on `cdnBase`, which `tinyBuild` trims like every
  other base-accepting entry (`cdn-base.test.ts` pins it; an earlier note here
  claimed it emitted `host//:uuid/`, which stopped being true when the trim landed).
  `search`/`hash` carry their own `?`/`#`, and `tinyParse` on a
  non-url returns nonsense fields rather than throwing. There is also no
  `replace`/`without` at this level, so appending an operation the chain already has
  leaves both occurrences (last one wins at the CDN). All five are tested in
  `docs-string-level.test.ts` so the page cannot drift from them.
- **A secure-delivery token is invalidated by _any_ edit, appending included.** An
  earlier draft said appending was safe — true only for the conversion prefix.
- **`tiny/url.ts` is string surgery, not a parser, and must stay that way.** `tinyParse`
  cuts a url into `cdnBase`/`uuid`/`modifiers`/`tail` and `tinyBuild` joins it back:
  no grammar, no `CdnOperation`, no kinds, no throwing — and no chain handling
  either: normalizing a loose modifiers string is `tiny/literals.ts`'s job, since the
  chain is its domain object, not the url's. Same job in every bundle — parse a url,
  append one operation, serialize — measured with esbuild `--minify` on the prod
  flavor: `parseCdnUrl` 1326 B brotli, `parseFileUrl` 821 B, `tinyParse` + `modifiers`
  362 B, `tinyParse` + `normalizeModifiers` 373 B, and `tinyParse` behind an
  `isFileUrl` guard 890 B. These are the figures the string-level guide page
  publishes; keep the two in step, and re-measure rather than copying them forward. The round-trip law holds for every url in
  the corpus, **including** the ones whose fields it gets wrong — a group element
  keeps `nth/2/` in `modifiers`, a proxy keeps its embedded source there and its
  `uuid` is `-`. That is the ceiling.
- **`tiny/` is public, and its publicity is the thing to be careful about.** It is a
  registered entry point, re-exported from the root entry, and documented with its own
  guide page — an earlier note here called it internal and told you not to expose it,
  which stopped being true once those three things landed. Treat it as supported API:
  its signatures and the round-trip law are a contract, and a breaking change to
  either needs the same care as one to `parseCdnUrl`.
  What has _not_ changed is the ceiling above. Being public is not a reason to grow
  it: do not teach it kinds, do not add validation, do not make it throw. A caller
  who needs any of those wants `parseFileUrl`. The guide page has to keep saying so,
  because the failure mode is a consumer reaching for `tinyParse` on a url whose kind
  they have not established and quietly getting `uuid: '-'`.
- **`ModifiersChain` is nominal, not a pattern type.** `string & { readonly
[CHAIN]: true }`, branded through the one `asModifiersChain` entrance, so it is a
  plain string at run time and free. A pattern type (`'' | `${string}/`) was tried
  first and **rejected**: every string ending in a slash satisfied it, which is
  barely a type. The brand states the invariant that matters — this string came out
  of the chain machinery — so a hand-written `'-/resize/300x/'`, a stored
  `'resize/300x'`, a stray `''` and a `` `${a}${b}` `` concatenation are all
rejected. Producers: `modifiers()`(typed literals),`normalizeModifiers()`(a
loose string of any shape: missing marker, doubled or edge slashes, surrounding
whitespace — the same leniency`parseOperations`grants, normalized with`split('/').filter().join('/')`, one pass, no regex), `joinModifiers()`(append,
since template concatenation widens back to`string`) and `tinyParse`. The empty
chain is `modifiers()`, not `''`— that is the ergonomic price of nominality, paid
on purpose. Verified to survive the emitted`.d.ts`: `declare const CHAIN: unique
  symbol`lands in`dist/types`, and a consumer compiled against it still gets the
rejections. Operation *names* remain `OperationLiteral`'s business; the brand says
  where a chain came from, not that every directive in it is spelled right.
- **A tagged-template writer (`` mods`resize/100x` ``) was built, measured and
  removed. Do not reintroduce it.** TypeScript hands a tag function a
  `TemplateStringsArray`, never the literal text
  ([TS#33304](https://github.com/microsoft/TypeScript/issues/33304)) — measured
  against five signature variants (`readonly [...S]`, `S`, `S & { raw }`,
  `readonly [...S] & { raw }`, `readonly [S]`, with and without `const` type
  parameters), every one widening to `readonly string[]`, `TemplateStringsArray` or
  `string`. So a tag cannot validate `` mods`rezise/100` ``, and it duplicated
  `modifiers()` while quietly dropping its checking. The checked way to interpolate
  is a template literal in **argument** position — ``modifiers(`resize/${width}x`)``
  — where the `OperationLiteral` parameter type applies contextually.
- **There are two ways to write an operation, and the choice is about inputs.** The
  creators in `/ops` build `CdnOperation` objects and validate; `OperationLiteral` +
  `modifiers()` in `literals.ts` are typed strings with no runtime machinery at all
  (852 → 254 B brotli measured over twenty operations, byte-identical output). Use
  the **creators** when a value comes from user input or arithmetic, because their
  range checks — dev-only, but that is where you want them — are the only thing
  standing between a bad number and a broken URL. Use the **literals** when the
  caller authors the operation itself and only needs the chain. Do not add a third
  way. `OperationLiteral` reuses the creators' own enum types (`Format`, `Quality`,
  `FilterName`, …) so the two cannot disagree about an enum, and
  `literals.test.ts` fails if the library gains an operation the union has not caught
  up with — the fixture there is type-checked against the union and runtime-checked
  against every creator's `opName`.
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
- **Prod flavors minify with terser, not esbuild** — measured ~37% smaller
  gzip on `fluent.js`, ~19% across `dist/prod`. Only safe `compress`/`mangle`
  options are on; `unsafe*` buys ~1% and is not worth it. The IIFE build needs
  `mangle.reserved: ['UCCdnUrl']`, otherwise top-level mangling renames the
  global away (smoke test catches this). `mangleProps` was measured and
  **rejected**: ~31 B gzip on `fluent`, ~20 B on the IIFE, against a real risk
  of inconsistent renaming if a `_`-prefixed prop ever crosses a chunk
  boundary.

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
  `operationMatches` compares **base names** (`operationBaseName` strips the
  `~N`), so matching is symmetric: `thumbs~5` matches the `thumbs` ref, the
  `thumbs` operation matches a `thumbs~5` ref, and `thumbs~5` matches
  `thumbs~3` — which is what lets `replace` swap a counted op instead of
  appending a second one. Bare `thumb`/`thumbs` are NOT valid operations.
- **Order-dependent operations are modelled in `validate/dependencies.ts`**:
  `font`/`text_align`/`text_box` are state for the **following** `text` (their
  own JSDoc says so, sourced from the overlay docs), `stretch` for the
  following `resize`/`scale_crop`, and `format/jpeg` is a chain-wide 5000px
  ceiling. Nearest modifier wins. The table is **deliberately incomplete** —
  overlay z-order and `blur_region`/`blur` are unmodelled because the rules
  aren't public. Do not add edges you cannot source; an honest gap beats a
  guess. The public surface is **ref-based, never index-based** (`operationInputs(ops, 'text')`)
  to match `has`/`get`/`getAll`; passing an element of the array pins that exact
  occurrence by identity, anything else takes the first match. Index arithmetic
  stays private — `operationGraph` is the positional view, and `validateImage`
  drives its orphaned-modifier diagnostics off it, so the two cannot drift.
- The engine's exact accept/reject rules live in the private
  `uploadcare/actions_dsl` repo (inaccessible). The public docs are the spec.
- **Docs source of truth is `uploadcare/fern-docs`** — `uploadcare/docs` is
  legacy; never cite it.
- Secure-delivery tokens (`?token=…`) are preserved through parse/serialize
  but never generated here; editing operations invalidates an existing
  signature. The string-level guide states this as a hazard, not a feature — reader
  testing caught it framed as "the token rides along untouched", which reads as
  reassurance that signed delivery keeps working.
- **`normalizeModifiers` collapses runs of slashes, which destroys an embedded URL**:
  `'preview/https://example.com/'` → `'-/preview/https:/example.com/'`. That is
  exactly what `tinyParse` puts in `modifiers` for a proxy url, so normalizing the
  output of `tinyParse` on an unknown-kind url corrupts it. Documented and tested,
  not fixed: collapsing is what makes the lenient shapes work, and the alternative is
  teaching the normalizer about proxy urls, which is the machinery `tiny/` exists to
  avoid.
- **The string level only pays off when the caller already knows the url's kind.**
  Guarding an unknown url with `isFileUrl` measures **890 B** brotli against **821 B**
  for `parseFileUrl` + `serializeFileUrl` — the guarded string-level path is _larger_
  than the real parser, which also validates. The unguarded path is 362 B. So any
  advice to use `tinyParse` on urls of mixed kind is wrong twice over, and the guide
  leads with that. Re-measure when `tiny/` changes: splitting `search`/`hash` out of
  the old `tail` field cost 77 B on its own.

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
  alone. Constrain that agent to the single page — it must not read the source,
  or it answers from the code and proves nothing about the prose.
- **Page snippets are executed, not trusted.** `docs-cookbook.test.ts`,
  `docs-how-to.test.ts`, `docs-string-level.test.ts` and `docs-cdn-base.test.ts`
  mirror the snippets from their pages verbatim, so a page cannot claim an output the code does not produce.
  Tables of behaviour count too: the url-kind table on the string-level page has one
  test per row. Add to these when you add a page with runnable examples.

## Monorepo integration

- **`@uploadcare/cname-prefix` is the one runtime dependency** (workspace
  sibling, version in lockstep), imported only by `src/prefixed-cdn-base.ts` via
  its `/sync` entry — the sync path is pure JS, so the Node smoke tests pass. Do
  not import it anywhere else, and do not add a second runtime dep without the
  same kind of size accounting.

- Registered in root `package.json` `workspaces` and `ship.config.mjs`
  `packagesToPublish`. Version is synced by ship-js (currently in lockstep
  with the monorepo); no `src/version.ts` here.
- `files: ["dist", …]` in package.json — do not change to `dist/*` (npm glob
  would drop the nested `dist/dev|prod|types` trees from the tarball).
- New entry points require updates in FIVE places: `vite.config.js` entries,
  `package.json` exports (types + development + production + defaults),
  `typedoc.json` entryPoints, `scripts/smoke-node.mjs` entries list, and the
  docs entry-points table in `docs/guide/getting-started.md`.
