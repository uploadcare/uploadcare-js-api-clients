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
Two variants return the same string; they differ only in where the SHA-256 comes
from.

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
public key, so resolve it once at startup and keep the string instead of
recomputing it for every URL.

### Which one to use

| Runtime                       | Use      | Why                                                        |
| ----------------------------- | -------- | ---------------------------------------------------------- |
| Browser, Web/Service Worker   | `…Async` | WebCrypto is already there, so nothing is bundled          |
| Browser, when you can't await | `…Sync`  | works, and carries a SHA-256 with it (about a kilobyte)    |
| Node.js (server code)         | `…Sync`  | `node:crypto` is native _and_ synchronous — no `Promise`   |
| Node.js (isomorphic code)     | `…Async` | works too: WebCrypto via `node:crypto`, no runtime branch  |
| React Native                  | `…Sync`  | no WebCrypto in Hermes; the portable build is the only one |

In a browser, prefer the async variant. It calls
[`crypto.subtle.digest`](https://developer.mozilla.org/docs/Web/API/SubtleCrypto/digest),
the platform's own implementation, so the digest adds nothing to your bundle. It
needs a secure context, HTTPS or `localhost`; on a plain `http://` origin
`crypto.subtle` is undefined and the call fails.

Use the sync variant when a `Promise` would infect the call site, such as a
config module's top-level export or a synchronous render path. It works in a
browser and costs you the SHA-256 it carries, about a kilobyte.

On Node, prefer the sync variant. The `node` export condition, which Node.js,
Vitest and bundlers targeting Node all resolve, swaps in a build backed by
`node:crypto`, so the portable SHA-256 never reaches a server bundle. Your
import stays the same, and the digest is native and synchronous — no `Promise`
to await.

The async variant works on Node too. Under the same `node` condition it takes
WebCrypto from `node:crypto` rather than the global scope, and returns the same
string the sync one does. Reach for it only to keep a single code path across
browser and server: isomorphic or SSR code that already awaits
`getPrefixedCdnBaseAsync` no longer has to branch on the runtime, and no
`createHash` reaches the call path.

On React Native, use the sync variant too. The `react-native` condition resolves
to the portable build, which is the only one that can run there: Hermes has
neither `crypto.subtle` nor `node:crypto`. It needs `TextEncoder`, which Hermes
provides from React Native 0.74 and Expo SDK 51. On anything older, add a
polyfill.

### Node version compatibility

Both variants run on every Node the package supports (`engines: node >=16`),
and neither needs a flag:

| API      | Backed by                  | Available since |
| -------- | -------------------------- | --------------- |
| `…Sync`  | `node:crypto` `createHash` | Node 0.x        |
| `…Async` | `node:crypto` `webcrypto`  | Node 15.0.0     |

The async build reads WebCrypto from `node:crypto` (its `webcrypto` export),
not from `globalThis.crypto`. So it does not depend on the global `crypto`
object — which became available by default only in Node 19 — and needs no
`--experimental-global-webcrypto` flag. On every version this package targets,
both APIs are present.

### What it costs

Marginal cost of the helper, esbuild `--minify` over the published build:

| Import                                  | min    | gzip   | brotli     |
| --------------------------------------- | ------ | ------ | ---------- |
| `/async` in a browser                   | 413 B  | 314 B  | **269 B**  |
| `/sync` in a browser or React Native    | 1812 B | 1111 B | **968 B**  |
| `/sync` on Node (`node:crypto`)         | 290 B  | 249 B  | **209 B**  |
| both, from the root entry, in a browser | 2082 B | 1247 B | **1081 B** |

Brotli is the column to read, since that is what a CDN serves. In a browser the
async variant costs about a quarter of the sync one. On Node the numbers change:
the digest is `node:crypto`, external to the bundle, so the async variant is a
few hundred bytes there too — about the same as `/sync` on Node above, not the
kilobyte the portable sync build costs in a browser. Size is not the deciding
factor on Node; pick `…Sync` to avoid a `Promise`, `…Async` to share code with
the browser.

### Entry points

| Import                           | Contains                              |
| -------------------------------- | ------------------------------------- |
| `@uploadcare/cname-prefix`       | both variants and `isPrefixedCdnBase` |
| `@uploadcare/cname-prefix/async` | the async variant only                |
| `@uploadcare/cname-prefix/sync`  | the sync variant only                 |

Import a subpath to keep the other variant out of the bundle. Each subpath
carries `node` and `react-native` conditions, so your bundler or runtime picks
the implementation: the native digest on Node, the portable one on React Native.

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
