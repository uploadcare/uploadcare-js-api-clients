# Uploadcare Signed Uploads Client

<a href="https://uploadcare.com/?utm_source=github&utm_campaign=uploadcare-js-api-clients">
    <img align="right" width="64" height="64"
      src="https://ucarecdn.com/edfdf045-34c0-4087-bbdd-e3834921f890/userpiccircletransparent.svg"
      alt="">
</a>

`@uploadcare/signed-uploads` secures uploads to Uploadcare's [Signed Uploads][uc-docs-signed-uploads] feature. It has two halves:

- **`@uploadcare/signed-uploads`** — Node only. Mints the credentials the Upload API accepts: a **JWT** for the `Authorization: Bearer` scheme (with optional endpoint scope and operation limits), or the [signature and expire pair][uc-docs-signature]. Both need your project secret key, so both belong on your server.
- **`@uploadcare/signed-uploads/client`** — browser-first, and runs in Node too. Caches a token minted by your server and replaces it before it expires. Never touches the secret key.

Zero dependencies, full TypeScript support.

[API Reference](https://uploadcare.github.io/uploadcare-js-api-clients/signed-uploads/)

[![Build Status][badge-build]][build-url]
[![NPM version][npm-img]][npm-url]
[![GitHub release][badge-release-img]][badge-release-url]
[![Uploadcare stack on StackShare][badge-stack-img]][badge-stack-url]

<!-- toc -->

- [Install](#install)
- [Usage](#usage)
  - [Minting a JWT on your server](#minting-a-jwt-on-your-server)
  - [Caching the token in the browser](#caching-the-token-in-the-browser)
  - [Legacy signed uploads](#legacy-signed-uploads)
- [Security issues](#security-issues)
- [Feedback](#feedback)

<!-- tocstop -->

## Install

```bash
npm install @uploadcare/signed-uploads
```

## Usage

**NOTE**: The Uploadcare API accepts `expire` as unix time in seconds. However, this library accepts time in milliseconds, as per the Node.js standard.

### Minting a JWT on your server

```typescript
import { generateAuthToken } from '@uploadcare/signed-uploads'

// In your endpoint, e.g. GET /uploadcare-token
const token = generateAuthToken('YOUR_SECRET_KEY', {
  lifetime: 60 * 30 * 1000 // expire in 30 minutes, 24 hours max
})
```

Tokens can be restricted to the endpoints they reach and the number of operations they allow:

```typescript
const token = generateAuthToken('YOUR_SECRET_KEY', {
  lifetime: 60 * 30 * 1000,
  // Exact paths, or a trailing `*` after a `/` as a whole-segment prefix.
  // Omit to allow every signed endpoint.
  scope: ['/base/', '/multipart/*'],
  // 1 to 100000
  operations: 20
})
```

Anything the Upload API would refuse — a lifetime over 24 hours, a malformed scope item, an out-of-range operation count — throws here instead, so the mistake surfaces on your server rather than as a `403` in someone's browser.

### Caching the token in the browser

`AuthTokenCache` fetches a token from your endpoint, holds it, and replaces it shortly before it expires. Pass `getToken` straight to `@uploadcare/upload-client`, which calls it before every request:

```typescript
import { AuthTokenCache } from '@uploadcare/signed-uploads/client'
import { uploadFile } from '@uploadcare/upload-client'

const tokens = new AuthTokenCache({
  fetchToken: async () => {
    const response = await fetch('/uploadcare-token')
    return (await response.json()).token
  }
})

await uploadFile(file, {
  publicKey: 'YOUR_PUBLIC_KEY',
  authToken: tokens.getToken
})
```

Concurrent callers share a single request rather than each starting their own.

**With SSR**, hand the cache a token you already minted while rendering, so the first upload needs no round-trip:

```typescript
const tokens = new AuthTokenCache({
  fetchToken,
  initialToken: tokenRenderedIntoThePage
})
```

`AuthTokenCache` runs in Node as well as the browser (it needs only `atob` and
`TextDecoder`). Be careful with it on a server: a module-level cache is shared
by every request the process handles, so a token minted for one visitor would be
served to the next. If your tokens carry per-user claims such as `sub`, build
the cache per request — or mint the token directly with `generateAuthToken`,
which is what the server has the secret key for.

**With React**, keep one long-lived cache and reassign `fetchToken` rather than building a new cache. A component passes a new closure on every render, and rebuilding would throw the token away each time:

```typescript
tokens.fetchToken = props.fetchToken // cached token is kept
tokens.invalidate() // call this when the change is real, e.g. on sign-out
```

To authenticate your own requests, `getAuthHeaders` builds the header and returns `{}` for an absent token, so it can be spread unconditionally:

```typescript
import { getAuthHeaders } from '@uploadcare/signed-uploads/client'

fetch(url, { headers: { ...getAuthHeaders(await tokens.getToken()) } })
```

### Legacy signed uploads

```typescript
import { generateSecureSignature } from '@uploadcare/signed-uploads'

// by the expiration timestamp in milliseconds since the epoch
const { secureSignature, secureExpire } = generateSecureSignature(
  'YOUR_SECRET_KEY',
  {
    expire: Date.now() + 60 * 30 * 1000 // expire in 30 minutes
  }
)

// by the expiration date
const { secureSignature, secureExpire } = generateSecureSignature(
  'YOUR_SECRET_KEY',
  {
    expire: new Date('2099-01-01') // expire on 2099-01-01
  }
)

// by the lifetime in milliseconds
const { secureSignature, secureExpire } = generateSecureSignature(
  'YOUR_SECRET_KEY',
  {
    lifetime: 60 * 30 * 1000 // expire in 30 minutes
  }
)
```

A pair of `secureSignature` and `secureExpire` (string with a unixtime in seconds) can be passed directly to the [corresponding options][upload-client-secure-options] of `@uploadcare/upload-client`.

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
[npm-img]: http://img.shields.io/npm/v/@uploadcare/signed-uploads.svg
[npm-url]: https://www.npmjs.org/package/@uploadcare/signed-uploads
[badge-build]: https://github.com/uploadcare/uploadcare-js-api-clients/actions/workflows/checks.yml/badge.svg
[build-url]: https://github.com/uploadcare/uploadcare-js-api-clients/actions/workflows/checks.yml
[uc-docs-signed-uploads]: https://uploadcare.com/docs/security/secure-uploads-auth-token/?utm_source=github&utm_campaign=uploadcare-js-api-clients
[uc-docs-signature]: https://uploadcare.com/docs/security/secure-uploads/?utm_source=github&utm_campaign=uploadcare-js-api-clients
[upload-client-secure-options]: https://github.com/uploadcare/uploadcare-js-api-clients/blob/master/packages/upload-client/README.md#securesignature-string
