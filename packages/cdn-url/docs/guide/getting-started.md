# Getting started

`@uploadcare/cdn-url` builds and parses [Uploadcare CDN](https://uploadcare.com/docs/delivery/cdn/) URLs — image transformations, file groups, delivery proxy and conversion paths — with full TypeScript types and zero dependencies.

## Install

::: code-group

```sh [npm]
npm install @uploadcare/cdn-url
```

```sh [pnpm]
pnpm add @uploadcare/cdn-url
```

```sh [yarn]
yarn add @uploadcare/cdn-url
```

```sh [bun]
bun add @uploadcare/cdn-url
```

```sh [deno]
deno add npm:@uploadcare/cdn-url
```

:::

No bundler at all? The [IIFE global build](/guide/functional-vs-builder#the-fluent-mega-object) works from a `<script>` tag via unpkg/jsdelivr.

## Supported environments

The library touches no DOM and no Node-specific APIs — it runs anywhere modern JavaScript runs. Zero dependencies, `sideEffects: false`, ESM + CommonJS.

| Environment                                        | Support                                                                                                         |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Node.js                                            | **≥ 16** — production bundle by default; `node --conditions=development` opts into [dev checks](/guide/bundles) |
| Browsers                                           | evergreen: Chrome/Edge 87+, Firefox 78+, Safari 14+ — the full test suite runs in real Chromium on every change |
| Bun, Deno                                          | ✓ via npm compatibility                                                                                         |
| Edge runtimes (Cloudflare Workers, Vercel Edge, …) | ✓ — standard JavaScript only                                                                                    |
| React Native                                       | ✓ with a spec-compliant `URL` polyfill (Hermes' built-in `URL` is incomplete)                                   |
| No bundler                                         | ✓ via the [IIFE global build](/guide/functional-vs-builder#the-fluent-mega-object)                              |

The only platform features required are `URL` and `String.prototype.replaceAll` (ES2021) — present in every runtime above. Build artifacts are additionally smoke-tested in plain Node (ESM + CJS, every entry point) on every build.

## Build a URL

Compose typed operations into a URL:

```ts
import { serializeCdnUrl } from '@uploadcare/cdn-url'
import { preview } from '@uploadcare/cdn-url/ops'

serializeCdnUrl({
  origin: 'https://ucarecdn.com',
  uuid: 'c2499162-eb07-4b93-b31e-94a89a47e858',
  operations: [preview(1000, 400)]
})
// → https://ucarecdn.com/c2499162-…/-/preview/1000x400/
// format/auto + adaptive quality are applied by the CDN automatically
```

Every operation creator validates its input eagerly during development — `quality('ultra')` throws a `RangeError` telling you the allowed values. In production builds these checks are stripped for size: see [Dev & production bundles](/guide/bundles) for the exact contract.

## Parse and edit a URL

Any CDN URL decomposes into a plain object you can edit and serialize back:

```ts
import { parseCdnUrl, serializeCdnUrl } from '@uploadcare/cdn-url'
import { stripMeta } from '@uploadcare/cdn-url/ops'

const parsed = parseCdnUrl('https://ucarecdn.com/:uuid/-/resize/300x/photo.jpg')
// { kind: 'file', uuid: ':uuid', operations: [{ name: 'resize', params: ['300x'] }], filename: 'photo.jpg', … }

serializeCdnUrl({
  ...parsed,
  operations: [...parsed.operations, stripMeta('sensitive')]
})
// → https://ucarecdn.com/:uuid/-/resize/300x/-/strip_meta/sensitive/photo.jpg
```

Parsing is lenient: operations the library doesn't know (including internal `@`-prefixed ones) pass through untouched, so `serializeCdnUrl(parseCdnUrl(url)) === url` always holds.

## Pick your entry points

The package is split into atomic entry points — import only what you use:

| Entry                           | What's inside                                                              |
| ------------------------------- | -------------------------------------------------------------------------- |
| `@uploadcare/cdn-url`           | `parseCdnUrl`, `serializeCdnUrl`, `parseOperations`, domain helpers, types |
| `@uploadcare/cdn-url/ops`       | ~45 image operation creators                                               |
| `@uploadcare/cdn-url/group`     | group ids, `nth` elements, archives                                        |
| `@uploadcare/cdn-url/proxy`     | delivery proxy URLs for remote sources                                     |
| `@uploadcare/cdn-url/video`     | video conversion paths                                                     |
| `@uploadcare/cdn-url/document`  | document conversion paths                                                  |
| `@uploadcare/cdn-url/gif2video` | animated image → video URLs                                                |
| `@uploadcare/cdn-url/builder`   | chainable `CdnUrl` facade                                                  |
| `@uploadcare/cdn-url/validate`  | cross-operation chain diagnostics                                          |

## Prefer one import for everything?

The fluent entry trades tree-shaking for convenience — the whole library behind a single chainable object:

```ts
import { cdn } from '@uploadcare/cdn-url/fluent'

cdn.file(uuid).preview(1000, 400).stripMeta('sensitive').href
```

See [Functional core vs builder vs fluent](/guide/functional-vs-builder).

## Where next

- [CDN URL anatomy](/guide/url-anatomy) — how the URLs are structured and what the parser gives you
- [Render stored URLs](/how-to/render-stored-urls) — the most common real-world task
- [Functional core vs builder](/guide/functional-vs-builder) — two API styles, when to use which
- [Dev & production bundles](/guide/bundles) — what throws where, and why production is silent
- [API Reference](/reference/) — every function, with examples
