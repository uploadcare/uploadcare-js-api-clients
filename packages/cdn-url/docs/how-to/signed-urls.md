# Signed URLs

[Secure delivery](https://uploadcare.com/docs/security/secure-delivery/) puts a signed token on the URL, and the CDN returns `403 Forbidden` without a valid one. This library never generates tokens — signing needs your project's secret and belongs on your backend — but it parses, preserves and round-trips them, and the shape of the token decides how much URL-building you can safely do on the client.

## What the token says

```
?token=exp=1735689600~acl=/:uuid/*~hmac=<hex digest>
```

Three fields: `exp` is a Unix timestamp in seconds, `acl` is the path the token authorizes, and `hmac` is a hex-encoded HMAC-SHA256 over the token body (`exp=…~acl=…`), keyed with your hex-decoded signing secret.

Secure delivery is served from its own host, with an extra label: `<prefix>.s.ucarecd.net`. Take that value from your project's delivery settings rather than assembling it by string surgery — and note that [`detectDomainKind`](/how-to/cookbook#i-want-to-know-if-a-string-is-even-an-uploadcare-url) reports it as `prefixed`, since it lives in the same zone.

## The `acl` decides whether the client may edit

The ACL supports a suffix wildcard, and the CDN verifies the request path against it:

| `acl`                   | Authorizes                              | Client may build variants?  |
| ----------------------- | --------------------------------------- | --------------------------- |
| `/:uuid/-/resize/640x/` | exactly that one derivative             | **no** — any edit is a 403  |
| `/:uuid/`               | the original only                       | **no**                      |
| `/:uuid/*`              | the original and every derivative of it | **yes**                     |
| `/*`                    | every file in the project               | yes — see the warning below |

So "editing a signed URL breaks it" is true for an exact-path ACL and **false** for a wildcard one. Under an exact-path ACL _any_ change to the path is a `403` — appending, removing, reordering, even rebasing onto another host. Under `acl=/:uuid/*` all of those verify, because the `hmac` covers the token body while the path only has to match the ACL.

Avoid `acl=/*` unless you mean it: one leaked URL then authorizes every file in the project for the token's lifetime, and Uploadcare uuids are often discoverable from other responses. Scope to the file you are serving.

```ts
// signed with acl=/:uuid/*  →  edits keep verifying
const stored = `${cdnBase}/${uuid}/-/preview/300x300/?token=exp=…~acl=/${uuid}/*~hmac=…`

const parsed = parseCdnUrl(stored)
serializeCdnUrl({
  ...parsed,
  operations: [...parsed.operations, resize({ width: 640 })]
})
// the token rides along untouched, and the CDN still accepts it
```

The token survives because it lives in `search`, which parse and serialize carry verbatim — `serializeCdnUrl(parseCdnUrl(url)) === url` holds for signed URLs like any other.

## Two architectures

**Sign each variant on the backend.** Tightest ACL, no client-side building: your API returns finished URLs, one per size you intend to serve. Use it when the derivative set is small and known — an avatar, a hero image.

Signing is ~10 lines with `node:crypto`. The key is your project's **secret signing key** from [project settings](https://uploadcare.com/docs/security/secure-delivery/), hex-decoded before use, and the digest covers the token body exactly as it appears in the URL:

```ts
import { createHmac } from 'node:crypto'

function signedUrl(href: string, secret: string, ttlSeconds: number): string {
  const { pathname } = new URL(href)
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const acl = pathname // this exact derivative; use `/${uuid}/*` to allow edits
  const hmac = createHmac('sha256', Buffer.from(secret, 'hex'))
    .update(`exp=${exp}~acl=${acl}`)
    .digest('hex')
  return `${href}?token=exp=${exp}~acl=${acl}~hmac=${hmac}`
}

const href = serializeCdnUrl({ cdnBase, uuid, operations: [preview(800, 600)] })
signedUrl(href, process.env.UPLOADCARE_SECRET_KEY!, 600)
```

Two details that cost people an afternoon: the secret is **hex-decoded** into the key rather than used as text, and the ACL goes into the digest **un-encoded**, exactly as written above.

The cost is that a `srcset` needs one signed URL per width, and every one of them expires.

**Sign once with a wildcard ACL, build on the client.** Your API returns a signed base URL with `acl=/:uuid/*`; the client uses this library to derive whatever it needs.

```ts
// client
const parsed = parseCdnUrl(signedFromApi)
const srcset = WIDTHS.map((w) => {
  const href = serializeCdnUrl({ ...parsed, operations: [preview(w, w)] })
  return `${href} ${w}w`
}).join(', ')
```

One token, any number of derivatives, and responsive images work normally. The trade is scope: that token authorizes every transformation of that file for its lifetime, so keep `exp` short.

## Expiry and caching pull in opposite directions

A short `exp` limits the damage of a leaked URL. But the token is part of the URL, so a new token is a new URL — a fresh browser cache entry and a fresh CDN cache key, even though the bytes are identical.

Practical middle ground: an hour of validity, with `exp` rounded down to the start of the current 15-minute slot, so everyone loading the page in that slot shares a URL and a cache entry:

```ts
const SLOT = 15 * 60
const exp = Math.floor(Date.now() / 1000 / SLOT) * SLOT + 3600
```

Minting a per-request `exp` guarantees a cache miss per request, at every layer.

## What this library will and will not do

It **preserves** tokens through parse, edit and serialize, and never strips one accidentally. It **does not** sign, verify, or check expiry — there is no secret in it, by design, and there never should be one in client-side code.

Clearing a token is deliberate and explicit — and note that `search` is the whole query string, so this drops any other parameters with it:

```ts
serializeCdnUrl({ ...parseCdnUrl(signed), search: '' })
```

The [string level](/guide/string-level-api) keeps tokens too, in its `search` field. Appending to the chain there is as safe as anywhere else — which is to say safe under a wildcard ACL and a `403` under an exact-path one. Replacing `modifiers` wholesale is riskier for a different reason: on a conversion result it drops the `video`/`gif2video` prefix, and nothing at that level will warn you.

## Related

- [I want to keep my signed URL working after editing it](/how-to/cookbook#i-want-to-keep-my-signed-url-working-after-editing-it) — the short version
- [Things that bite](/guide/cdn-base#things-that-bite) — rebasing a signed URL onto another host
- [Secure delivery](https://uploadcare.com/docs/security/secure-delivery/) on uploadcare.com
