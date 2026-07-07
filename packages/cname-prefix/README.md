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

The package builds a subdomain-based (prefixed) CDN base from your public key. Two variants
are available with identical output:

- `getPrefixedCdnBaseAsync` uses the Web Crypto API (`window.crypto.subtle`),
  returns a Promise, and works in browsers in a secure context (HTTPS or
  `localhost`). It is not available in Node.js or non-secure contexts.
- `getPrefixedCdnBaseSync` ships its own SHA-256, runs synchronously, and works
  anywhere: browsers (any context), Node.js, web workers, and edge runtimes.

```typescript
import { getPrefixedCdnBaseAsync, getPrefixedCdnBaseSync } from '@uploadcare/cname-prefix'

await getPrefixedCdnBaseAsync('demopublickey', 'https://ucarecd.net')
// 'https://1s4oyld5dc.ucarecd.net'

getPrefixedCdnBaseSync('demopublickey', 'https://ucarecd.net')
// 'https://1s4oyld5dc.ucarecd.net'
```

Import from `@uploadcare/cname-prefix/async` or `/sync` to include just one
variant. Use `isPrefixedCdnBase(cdnBase, base)` to check whether a CDN base is
already prefixed.

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

