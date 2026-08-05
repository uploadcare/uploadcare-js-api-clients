# Uploadcare CNAME Prefix

<a href="https://uploadcare.com/?utm_source=github&utm_campaign=uploadcare-js-api-clients">
    <img align="right" width="64" height="64"
      src="https://ucarecdn.com/edfdf045-34c0-4087-bbdd-e3834921f890/userpiccircletransparent.svg"
      alt="">
</a>

This package provides a helper for working with Uploadcare CDN CNAME prefixes.

[API Reference](https://uploadcare.github.io/uploadcare-js-api-clients/cname-prefix/)

[![Build Status][badge-build]][build-url]
[![NPM version][npm-img]][npm-url]
[![GitHub release][badge-release-img]][badge-release-url]
[![Uploadcare stack on StackShare][badge-stack-img]][badge-stack-url]

<!-- toc -->

- [Install](#install)
- [Usage](#usage)
- [Security issues](#security-issues)
- [Feedback](#feedback)

<!-- tocstop -->

## Install

```bash
npm install @uploadcare/cname-prefix
```

## Usage

The package builds a subdomain-based (prefixed) CDN base from your public key.
Two variants return the same string; the only difference is where the SHA-256
comes from, and that is a question about your runtime rather than about your
code.

```typescript
import {
  getPrefixedCdnBaseAsync,
  getPrefixedCdnBaseSync
} from '@uploadcare/cname-prefix'

await getPrefixedCdnBaseAsync('demopublickey', 'https://ucarecd.net')
// 'https://1s4oyld5dc.ucarecd.net'

getPrefixedCdnBaseSync('demopublickey', 'https://ucarecd.net')
// 'https://1s4oyld5dc.ucarecd.net'
```

Use `isPrefixedCdnBase(cdnBase, base)` to check whether a base is already
prefixed. Whichever variant you pick, the answer never changes for a given
public key — resolve it once at startup and keep the string, rather than
recomputing it per URL.

### Which one to use

| Runtime                       | Use      | Why                                                        |
| ----------------------------- | -------- | ---------------------------------------------------------- |
| Browser, Web/Service Worker   | `…Async` | WebCrypto is already there; nothing to bundle              |
| Browser, when you can't await | `…Sync`  | works, and carries a SHA-256 with it — about a kilobyte    |
| Node.js                       | `…Sync`  | `node:crypto` is native _and_ synchronous                  |
| React Native                  | `…Sync`  | no WebCrypto in Hermes; the portable build is the only one |

**In a browser, prefer the async variant.** It calls
[`crypto.subtle.digest`](https://developer.mozilla.org/docs/Web/API/SubtleCrypto/digest),
so the digest costs you a function call and no bundle weight. It needs a secure
context — HTTPS or `localhost`; on a plain `http://` origin `crypto.subtle` is
undefined.

**Reach for the sync variant when a `Promise` would infect the call site** — a
config module's top-level export, a synchronous render path. It is not a
mistake, it just means the SHA-256 ships with your app. That is the whole cost
of the choice.

**On Node, use the sync one.** The `node` export condition — which Node.js,
Vitest and bundlers targeting Node all resolve — swaps in a build backed by
`node:crypto`, so the portable SHA-256 never reaches a server bundle. The import
specifier does not change. The async variant is deliberately unavailable there:
it rejects with a `TypeError` naming the sync alternative, because avoiding a
bundled hash is a browser problem and Node does not have it.

**On React Native, use the sync one**, via the `react-native` export condition
that resolves to the portable build. Hermes has no `crypto.subtle` and no
`node:crypto`, so this is the only variant that can work. It needs
`TextEncoder`, which Hermes provides from React Native 0.74 / Expo SDK 51 — on
anything older, add a `TextEncoder` polyfill.

### What it costs

Marginal cost of the helper, esbuild `--minify` over the published build:

| Import                                  | min    | gzip   | brotli     |
| --------------------------------------- | ------ | ------ | ---------- |
| `/async` in a browser                   | 413 B  | 314 B  | **269 B**  |
| `/sync` in a browser or React Native    | 1812 B | 1111 B | **968 B**  |
| `/sync` on Node (`node:crypto`)         | 290 B  | 249 B  | **209 B**  |
| both, from the root entry, in a browser | 2082 B | 1247 B | **1081 B** |

Brotli is what a CDN serves, so that is the column to read. Neither figure is
large; the honest summary is that async is roughly a quarter of sync's cost in a
browser, and that on Node the question does not arise.

### Entry points

| Import                           | Contains                              |
| -------------------------------- | ------------------------------------- |
| `@uploadcare/cname-prefix`       | both variants and `isPrefixedCdnBase` |
| `@uploadcare/cname-prefix/async` | the async variant only                |
| `@uploadcare/cname-prefix/sync`  | the sync variant only                 |

Import a subpath to keep the other variant out of the bundle. Each subpath
carries `node` and `react-native` conditions, so the right implementation is
selected by your bundler or runtime — you write one import and get the native
digest on Node, the portable one on React Native.

## Security issues

If you think you ran into something in Uploadcare libraries that might have
security implications, please hit us up at
[bugbounty@uploadcare.com][uc-email-bounty] or Hackerone.

We'll contact you personally in a short time to fix an issue through co-op and
prior to any public disclosure.

## Feedback

Issues and PRs are welcome. You can provide your feedback or drop us a support
request at [hello@uploadcare.com][uc-email-hello].

[uc-email-bounty]: mailto:bugbounty@uploadcare.com
[uc-email-hello]: mailto:hello@uploadcare.com
[badge-stack-img]: https://img.shields.io/badge/tech-stack-0690fa.svg?style=flat
[badge-stack-url]: https://stackshare.io/uploadcare/stacks/
[badge-release-img]: https://img.shields.io/github/release/uploadcare/uploadcare-js-api-clients.svg
[badge-release-url]: https://github.com/uploadcare/uploadcare-js-api-clients/releases
[npm-img]: http://img.shields.io/npm/v/@uploadcare/cname-prefix.svg
[npm-url]: https://www.npmjs.org/package/@uploadcare/cname-prefix
[badge-build]: https://github.com/uploadcare/uploadcare-js-api-clients/actions/workflows/checks.yml/badge.svg
[build-url]: https://github.com/uploadcare/uploadcare-js-api-clients/actions/workflows/checks.yml
