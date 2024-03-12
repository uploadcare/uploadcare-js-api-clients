# Uploadcare Image Shrink

<a href="https://uploadcare.com/?utm_source=github&utm_campaign=uploadcare-js-api-clients">
    <img align="right" width="64" height="64"
      src="https://ucarecdn.com/edfdf045-34c0-4087-bbdd-e3834921f890/userpiccircletransparent.svg"
      alt="">
</a>

File Uploader lets you accept hi-res images and shrink them in size to a reasonable resolution, keeping the original aspect ratio. See docs [here][uc-docs-image-shrink] wrapper to work with browser.

[API Reference](https://uploadcare.github.io/uploadcare-js-api-clients/image-shrink/)

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
npm install @uploadcare/image-shrink
```

## Usage

```typescript
import { shrinkFile } from '@uploadcare/image-shrink'

const shrinkedBlob = shrinkImage(blob, {
    size: number,
    quality?: number
})
```

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
[npm-img]: http://img.shields.io/npm/v/@uploadcare/image-shrink.svg
[npm-url]: https://www.npmjs.org/package/@uploadcare/image-shrink
[badge-build]: https://github.com/uploadcare/uploadcare-js-api-clients/actions/workflows/checks.yml/badge.svg
[build-url]: https://github.com/uploadcare/uploadcare-js-api-clients/actions/workflows/checks.yml
[uc-docs-image-shrink]: https://uploadcare.com/docs/file-uploader/feature-shrink/
