# Uploadcare Signed Uploads Client

<a href="https://uploadcare.com/?utm_source=github&utm_campaign=uploadcare-js-api-clients">
    <img align="right" width="64" height="64"
      src="https://ucarecdn.com/edfdf045-34c0-4087-bbdd-e3834921f890/userpiccircletransparent.svg"
      alt="">
</a>

This is Uploadcare [Signed Uploads][uc-docs-signed-uploads] wrapper to work with
Node.js.

[API Reference](https://uploadcare.github.io/uploadcare-js-api-clients/signed-uploads/)

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
npm install @uploadcare/signed-uploads
```

## Usage

**NOTE**: The Uploadcare API accepts `expire` as unix time in seconds. However, this library accepts time in milliseconds, as per the Node.js standard.

```typescript
import { generateSecureSignature } from '@uploadcare/signed-uploads'

// by the expiration timestamp in milliseconds since the epoch
const { secureSignature, secureExpire } = generateSecureSignature('YOUR_SECRET_KEY', {
  expire: Date.now() + 60 * 30 * 1000 // expire in 30 minutes
})

// by the expiration date
const { secureSignature, secureExpire } = generateSecureSignature('YOUR_SECRET_KEY', {
  expire: new Date("2099-01-01") // expire on 2099-01-01
})

// by the lifetime in milliseconds
const { secureSignature, secureExpire } = generateSecureSignature('YOUR_SECRET_KEY', {
  lifetime: 60 * 30 * 1000 // expire in 30 minutes
})
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
[uc-docs-signed-uploads]: https://uploadcare.com/docs/security/secure-uploads/#signed-uploads?utm_source=github&utm_campaign=uploadcare-js-api-clients
[upload-client-secure-options]: https://github.com/uploadcare/uploadcare-js-api-clients/blob/master/packages/upload-client/README.md#securesignature-string
