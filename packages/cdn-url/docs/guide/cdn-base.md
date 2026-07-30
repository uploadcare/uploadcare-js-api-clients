# The CDN base

Every URL this library builds starts with a **CDN base**: the scheme and host your project delivers from, with no path. It is the one thing the library cannot guess for you, so everything that produces a URL asks for it. (Conversion _paths_ are the exception — they carry no host by design; see [below](#things-that-bite).)

```
https://1s4oyld5dc.ucarecd.net/c2499162-…-47e858/-/preview/800x600/
└─────────────┬──────────────┘
           cdnBase
```

| Kind                                       | Host                   | Use it when                                            |
| ------------------------------------------ | ---------------------- | ------------------------------------------------------ |
| [prefixed](#the-prefixed-base-the-default) | `<prefix>.ucarecd.net` | almost always — it is your project's own subdomain     |
| [legacy](#the-legacy-base)                 | `ucarecdn.com`         | older accounts still delivering from the shared domain |
| [custom](#a-custom-cname)                  | `cdn.example.com`      | you pointed your own domain at Uploadcare              |

Not sure which one your project uses? Two ways to find out without guessing: read the delivery settings in [app.uploadcare.com](https://app.uploadcare.com/), or look at a URL the project already produced — an upload's `cdnUrl`, or any stored URL — and hand it to `detectDomainKind`, [below](#things-that-bite). Inheriting a codebase that serves from `ucarecdn.com` tells you the project is on the legacy domain; a new project will not be.

See [CDN settings](https://uploadcare.com/docs/delivery/cdn/) in the platform docs for how delivery is configured on the account side, and [CDN URL anatomy](/guide/url-anatomy#domains) for how the parser classifies a host it is handed.

## The prefixed base (the default)

Your project delivers from a subdomain of `ucarecd.net` derived from its public key. `prefixedCdnBase` computes it:

```ts
import { prefixedCdnBase } from '@uploadcare/cdn-url'

prefixedCdnBase('demopublickey')
// → https://1s4oyld5dc.ucarecd.net
```

The prefix is the first ten base36 digits of `sha256(publicKey)`, shared with the rest of the SDK through [`@uploadcare/cname-prefix`](https://www.npmjs.com/package/@uploadcare/cname-prefix). Given a public key the answer never changes, which is why you can compute it once and forget about it.

To find your own host, print it once — you never need to compute it again:

```sh
node --input-type=module -e \
  "import { prefixedCdnBase } from '@uploadcare/cdn-url'
   console.log(prefixedCdnBase('YOUR_PUBLIC_KEY'))"
```

Run it in the project where you installed the package. Your public key is the
public half of your [project's API keys](https://uploadcare.com/docs/keys/) —
[app.uploadcare.com](https://app.uploadcare.com/projects/-/api-keys/) lists it,
and it is safe to ship in client code.

Uploading through [`@uploadcare/upload-client`](https://www.npmjs.com/package/@uploadcare/upload-client)? Then you have already seen this host: that package prefixes by default from the same public key, so the `cdnUrl` it returns is on the same base you compute here. Nothing to reconcile.

Read those two hostnames carefully: `ucarecd.net` and `ucarecdn.com` are different zones, and the missing `n` is not a slip. They are not interchangeable. `ucarecd.net` also answers only _with_ a prefix in front of it — a bare `https://ucarecd.net/:uuid/` does not resolve — which is why this library never falls back to that zone on its own.

## The legacy base

Older projects deliver from `ucarecdn.com`, the original shared domain. This library treats it like any other host: it parses, serializes and builds on it exactly as it does on a prefixed base, so nothing forces you to migrate stored URLs. New projects are not given it, though, which is why it is never a default here — name it explicitly ([CDN settings](https://uploadcare.com/docs/delivery/cdn/) is where the platform side of that decision lives):

```ts
import { base, LEGACY_CDN_BASE } from '@uploadcare/cdn-url/fluent'

LEGACY_CDN_BASE // → https://ucarecdn.com

base(LEGACY_CDN_BASE).file(uuid).preview(800, 600).href
// → https://ucarecdn.com/:uuid/-/preview/800x600/
```

Stored URLs from that era keep working, and moving them onto your prefixed base is a field swap — see [rebasing onto another domain](/how-to/render-stored-urls#rebasing-onto-another-domain).

## A custom CNAME

If you [configured a custom CDN CNAME](https://uploadcare.com/docs/delivery/cdn/#settings), it is a DNS record pointing at your `ucarecd.net` subdomain, and delivery from it needs **no prefix**. Pass the host as it stands:

```ts
base('https://cdn.example.com').file(uuid).href
// → https://cdn.example.com/:uuid/
```

Do not run a custom domain through `prefixedCdnBase`: prefixing is what the shared `ucarecd.net` zone needs to tell projects apart, and your own domain already belongs to one project.

## Passing it to each API layer

The base is required everywhere, but each of the four [API styles](/guide/functional-vs-builder) takes it differently. In the snippets below `uuid`, `group` and `stored` stand for your own values.

::: code-group

```ts [fluent]
import { base, prefixedCdnBase } from '@uploadcare/cdn-url/fluent'

// bind it once, then chain
const cdn = base(prefixedCdnBase('demopublickey'))

cdn.file(uuid).preview(800, 600).href
cdn.group(groupId).nth(1).href

// rebase for one call, without touching `cdn`
cdn.base('https://cdn.example.com').file(uuid).href
```

```ts [functional core]
import { prefixedCdnBase, serializeCdnUrl } from '@uploadcare/cdn-url'
import { groupUrl } from '@uploadcare/cdn-url/group'
import { preview } from '@uploadcare/cdn-url/ops'

const cdnBase = prefixedCdnBase('demopublickey')

// a field on the input object…
serializeCdnUrl({ cdnBase, uuid, operations: [preview(800, 600)] })

// …or the first argument of the addressing helpers
groupUrl(cdnBase, group)
```

```ts [builder]
import { prefixedCdnBase } from '@uploadcare/cdn-url'
import { CdnUrl } from '@uploadcare/cdn-url/builder'
import { preview } from '@uploadcare/cdn-url/ops'

const cdnBase = prefixedCdnBase('demopublickey')

new CdnUrl({ cdnBase, uuid }).with(preview(800, 600)).href

// parsing carries the base over; `setCdnBase` replaces it
CdnUrl.parse(stored).setCdnBase(cdnBase).href
```

```ts [string level]
import { prefixedCdnBase, tinyBuild } from '@uploadcare/cdn-url'

tinyBuild({ cdnBase: prefixedCdnBase('demopublickey'), uuid })
```

:::

Two conveniences hold at every layer: a trailing slash is always trimmed (config values and `new URL(x).origin` both produce them), and parsing an existing URL fills the field in for you, so you only supply a base when building from a uuid.

Mixing bases in one app is fine, and normal — serving legacy URLs while writing new ones on your prefixed base is the usual migration shape. Either rebase per call with `cdn.base(...)`, or hold two entry objects:

```ts
const cdn = base(prefixedCdnBase('demopublickey'))
const legacy = base(LEGACY_CDN_BASE)
```

Only the fluent entry validates the base. `base()` with no argument is a compile error, and `base('')` throws a `TypeError` in [development builds](/guide/bundles), because there is no host it could fall back to. The functional core and the builder accept any string, including an empty one, and hand you back whatever that produces.

## Sync or async

Both variants exist, they return the same string, and the only difference is
where the SHA-256 comes from.

```ts
import { prefixedCdnBase, prefixedCdnBaseAsync } from '@uploadcare/cdn-url'

prefixedCdnBase('demopublickey') // → https://1s4oyld5dc.ucarecd.net
await prefixedCdnBaseAsync('demopublickey') // → the same string
```

**In a browser, prefer the async one.** It calls
[`crypto.subtle.digest`](https://developer.mozilla.org/docs/Web/API/SubtleCrypto/digest),
the platform's own implementation, so nothing is bundled but the call itself.

**On the server, or when awaiting is awkward, prefer the sync one.** Under Node
it resolves to a build backed by `node:crypto`, which is synchronous and native.
Reach for it in a browser too when a `Promise` would infect the call site — a
config module's top-level export, a synchronous render path, React Native — and
accept the extra kilobyte.

### What it costs

Marginal cost over a bundle that already imports `base` and one chain, measured
with esbuild `--minify` on the production build:

| Where    | Helper                 | Added       |
| -------- | ---------------------- | ----------- |
| browser  | `prefixedCdnBaseAsync` | **+221 B**  |
| browser  | `prefixedCdnBase`      | **+946 B**  |
| Node     | `prefixedCdnBase`      | **+151 B**  |
| Node     | `prefixedCdnBaseAsync` | unavailable |
| anywhere | a pasted literal host  | 0 B         |

Brotli, which is what a CDN serves. Neither number is large; the honest summary
is that a pasted literal beats both, and between the two the async one is roughly
a quarter of the cost in a browser.

### How each one works underneath

`prefixedCdnBaseAsync` awaits `crypto.subtle.digest('SHA-256', …)`, reads the 32
result bytes as four 64-bit words into a `bigint`, writes it in base 36 and takes
the leading 10 digits. WebCrypto is available in browsers, Web Workers and
Service Workers on secure origins (HTTPS or `localhost`); on a plain `http://`
origin `crypto.subtle` is undefined and the call fails. Under Node it rejects on
purpose, pointing you at the sync variant, because the async one exists precisely
to avoid bundling a hash — a problem Node does not have.

`prefixedCdnBase` needs a digest **before** it returns, and `crypto.subtle`
cannot provide one: it hands back a `Promise`, and no synchronous code can wait
for a promise. A `while` loop makes it worse rather than better — it occupies the
single thread that would run the promise's callback, so the wait can never end
(measured: 2.3 million spins over 250 ms, the digest never delivered). `Atomics.wait`
does block properly, but it throws on the main thread and needs a
`SharedArrayBuffer`, which requires cross-origin isolation. So in a browser this
variant carries a compact SHA-256 of its own — about a kilobyte, which is what
the table above charges you.

Under Node it carries nothing: `node:crypto`'s `createHash` is synchronous, and
the `node` export condition swaps the implementation out. Same import specifier,
same signature, no code change on your side.

## Compute it once, not per URL

Whichever variant you pick, the cost is per bundle rather than per call, and the answer never changes for a given public key. So resolve it once, as early as you can:

```ts
// config.ts — one call, one place
export const CDN_BASE = prefixedCdnBase(process.env.UPLOADCARE_PUBLIC_KEY!)

// or, in a browser app that can await during startup
export const CDN_BASE = await prefixedCdnBaseAsync(PUBLIC_KEY)
```

Better still, if the key is fixed at build time, paste the result as a literal and skip the hashing entirely:

```ts
export const CDN_BASE = 'https://1s4oyld5dc.ucarecd.net'
```

Nothing else in the library imports either helper, so not naming them drops both: importing everything from the fluent entry measures 19.8 kB minified / 6.6 kB gzipped, and 15.0 kB / 4.4 kB when neither is named. See [tree-shaking](/guide/functional-vs-builder#tree-shaking-what-you-actually-ship) for the full table.

## Things that bite

**A proxy endpoint is not a CDN base.** [Delivery proxy](/how-to/remote-images-via-proxy) URLs live on `<publicKey>.ucr.io` — the public key verbatim, no hashing — and `defaultProxyEndpoint` builds them. Passing a proxy endpoint to `prefixedCdnBase` produces a host that does not exist.

It goes to the proxy entry points, not to `base()`:

```ts
import { defaultProxyEndpoint, proxyUrl } from '@uploadcare/cdn-url/proxy'
import { preview } from '@uploadcare/cdn-url/ops'

const endpoint = defaultProxyEndpoint('demopublickey')
// → https://demopublickey.ucr.io

proxyUrl(endpoint, 'https://example.com/photo.jpg', [preview(800, 600)])
// → https://demopublickey.ucr.io/-/preview/800x600/https://example.com/photo.jpg
```

On a fluent chain the endpoint is the first argument of `cdn.proxy()`, so the base you bound with `base()` is simply not used for proxy URLs:

```ts
cdn.proxy(endpoint, 'https://example.com/photo.jpg').preview(800, 600).href
// → https://demopublickey.ucr.io/-/preview/800x600/https://example.com/photo.jpg
```

**Conversion paths have no base at all.** `videoPath` and `documentPath` return `/:uuid/video/…` strings for the REST convert API, deliberately without a host. See [Video & documents](/how-to/video-and-documents).

**Changing the base breaks a signature.** [Signed URLs](https://uploadcare.com/docs/security/secure-delivery/) are computed over a specific host and path, so rebasing a URL that carries `?token=…` invalidates it. The library preserves the query string and never generates tokens; re-sign after moving a URL.

**Check what you were handed, if it came from outside.** `detectDomainKind` classifies a host without building anything:

```ts
import { detectDomainKind } from '@uploadcare/cdn-url'

detectDomainKind('https://1s4oyld5dc.ucarecd.net') // → 'prefixed'
detectDomainKind('https://ucarecdn.com') // → 'legacy'
detectDomainKind('https://cdn.example.com') // → 'custom'
```

`custom` is the answer for any host it does not recognize, including a CNAME you own — see [Validate user input](/how-to/validate-user-input) for using it as a guard.
