# Remote images via proxy

The [delivery proxy](https://uploadcare.com/docs/delivery/proxy/) fetches images from **your existing storage** through the Uploadcare CDN — transformations included — without migrating a single file. Existing references keep working; the first request pulls the source in, subsequent ones hit the CDN cache.

## Build a proxified URL

```ts
import { defaultProxyEndpoint, proxyUrl } from '@uploadcare/cdn-url/proxy'
import { preview, resize } from '@uploadcare/cdn-url/ops'

const endpoint = defaultProxyEndpoint('YOUR_PUBLIC_KEY')
// → https://YOUR_PUBLIC_KEY.ucr.io

proxyUrl(endpoint, 'https://yoursite.com/assets/hero.jpg', [
  preview(), // no-arg preview marks the chain as processed — see Best practices
  resize({ width: 1280 })
])
// → https://YOUR_PUBLIC_KEY.ucr.io/-/preview/-/resize/1280x/https://yoursite.com/assets/hero.jpg
```

Operations sit **between** the endpoint and the source URL. The source keeps its own query string verbatim.

Custom proxy domains work the same way — pass your endpoint instead:

```ts
proxyUrl('https://proxy.yourdomain.com', source, ops)
```

## Parsing proxified URLs

`parseCdnUrl` recognizes the embedded source and returns the `proxy` kind:

```ts
const parsed = parseCdnUrl(
  'https://pubkey.ucr.io/-/resize/500x/https://example.com/a.jpg?v=2'
)
// { kind: 'proxy', origin: 'https://pubkey.ucr.io', operations: […], sourceUrl: 'https://example.com/a.jpg?v=2' }
```

Note there is no `uuid` — the shape doesn't have one, and TypeScript will tell you so.

## Prerequisites and failure modes

- **Allow-list the source domain** in your project settings first; otherwise the proxy answers `400 Domain is not allowed`.
- The proxy probes the source with a `HEAD` request before fetching — your origin server must answer those correctly.
- Fetching counts against your project's **upload units and storage** (it's a `from_url` upload under the hood); the processed variants don't.

## Proxy vs uploading

The proxy shines for incremental adoption and content you don't control. Once an image is _yours_ — uploaded, with a uuid — prefer regular CDN URLs: no allow-list, no first-request latency, and group/conversion features all apply.
