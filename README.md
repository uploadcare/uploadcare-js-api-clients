# Uploadcare JS API Clients

<a href="https://uploadcare.com/?utm_source=github&utm_campaign=uploadcare-js-api-clients">
    <img align="right" width="64" height="64"
      src="https://ucarecdn.com/edfdf045-34c0-4087-bbdd-e3834921f890/userpiccircletransparent.svg"
      alt="">
</a>

Uploadcare JavaScript/TypeScript API clients for Node.js and browsers. Handles uploads and further operations with files by wrapping Uploadcare Upload and REST APIs.

[![Build Status][badge-build]][build-url]
[![NPM version][npm-img]][npm-url]
[![GitHub release][badge-release-img]][badge-release-url]&nbsp;
[![Uploadcare stack on StackShare][badge-stack-img]][badge-stack-url]

## Packages

* [**@uploadcare/upload-client**](./packages/upload-client/README.md) — JavaScript and TypeScript SDK for the Uploadcare [Upload API][uc-docs-upload-api]. Handles direct binary uploads, multipart uploads for large files, URL-based and UUID-based uploads, and file group creation. Works in Node.js, browser, and React Native. Supports upload progress tracking, AbortController cancellation, concurrent request queuing, and signed uploads.
* [**@uploadcare/rest-client**](./packages/rest-client/README.md) — JavaScript and TypeScript SDK for the Uploadcare [REST API][uc-docs-rest-api]. Covers file management, groups, webhooks, media conversion (video and document), and add-ons (virus scanning, image recognition, background removal). Works in Node.js and browser. Supports Simple and signature-based authentication, async pagination with generators, automatic retry with exponential backoff for throttled requests, and job status polling for async operations.
* [**@uploadcare/signed-uploads**](./packages/signed-uploads/README.md) — Node.js library for generating cryptographic signatures required by Uploadcare's [Signed Uploads][uc-docs-signed-uploads] security feature. Returns a `{secureSignature, secureExpire}` pair ready to pass to `@uploadcare/upload-client`. Supports flexible expiration options (absolute timestamps, `Date` objects, or relative lifetimes). Zero dependencies, full TypeScript support.
* [**@uploadcare/image-shrink**](./packages/image-shrink/README.md) — Browser-based image compression library that shrinks images to a target resolution while preserving aspect ratios, EXIF metadata, and ICC color profiles. Outputs JPEG with configurable quality and automatically switches to PNG for images with transparency. Uses native canvas scaling with intelligent multi-pass fallback for iOS. Designed for pre-upload image optimization in web applications.

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
[github-releases]: https://github.com/uploadcare/uploadcare-js-api-clients/releases
[github-branch-release]: https://github.com/uploadcare/uploadcare-js-api-clients/tree/release
[github-contributors]: https://github.com/uploadcare/uploadcare-js-api-clients/graphs/contributors
[badge-stack-img]: https://img.shields.io/badge/tech-stack-0690fa.svg?style=flat
[badge-stack-url]: https://stackshare.io/uploadcare/stacks/
[badge-release-img]: https://img.shields.io/github/release/uploadcare/uploadcare-js-api-clients.svg
[badge-release-url]: https://github.com/uploadcare/uploadcare-js-api-clients/releases
[npm-img]: http://img.shields.io/npm/v/@uploadcare/upload-client.svg
[npm-url]: https://www.npmjs.org/package/@uploadcare/upload-client
[badge-build]: https://github.com/uploadcare/uploadcare-js-api-clients/actions/workflows/checks.yml/badge.svg
[build-url]: https://github.com/uploadcare/uploadcare-js-api-clients/actions/workflows/checks.yml
[uc-docs-upload-api]: https://uploadcare.com/docs/api_reference/upload/?utm_source=github&utm_campaign=uploadcare-js-api-clients
[uc-docs-rest-api]: https://uploadcare.com/api-refs/rest-api/v0.7.0/?utm_source=github&utm_campaign=uploadcare-js-api-clients
[uc-docs-signed-uploads]: https://uploadcare.com/docs/security/secure-uploads/#signed-uploads?utm_source=github&utm_campaign=uploadcare-js-api-clients
[uc-docs-metadata]: https://uploadcare.com/api-refs/rest-api/v0.7.0/#tag/File-Metadata
