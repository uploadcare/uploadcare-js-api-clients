# Uploadcare Javascript API

<a href="https://uploadcare.com/?utm_source=github&utm_campaign=uploadcare-js-upload-api">
  <img align="right" width="64" height="64"
    src="https://ucarecdn.com/2f4864b7-ed0e-4411-965b-8148623aa680/uploadcare-logo-mark.svg"
    alt="">
</a>

:bangbang: Work in progress. The API will be changed. Do not use it. Really. :bangbang:

JavaScript library for work with Uploadcare API.

[![NPM version][npm-img]][npm-url]
[![GitHub release][badge-release-img]][badge-release-url]&nbsp;
[![Uploadcare stack on StackShare][badge-stack-img]][badge-stack-url]

* [Requirements](#requirements)
* [Install](#install)
* [Usage](#usage)
* [Configuration](#configuration)
* [Security issues](#security-issues)
* [Feedback](#feedback)

## Requirements


## Install

```bash
npm install @uploadcare/upload-api --save
```

## Usage

```javascript
import UploadcareUpload, {uploadAPIRequest} from '@uploadcare/upload-api'

uploadAPIRequest(config, settings)

const upload = new UploadcareUpload(settings)

upload.api.request(config, settings)
```

## Configuration


## Security issues

If you think you ran into something in Uploadcare libraries which might have
security implications, please hit us up at [bugbounty@uploadcare.com][uc-email-bounty]
or Hackerone.

We'll contact you personally in a short time to fix an issue through co-op and
prior to any public disclosure.

## Feedback

Issues and PRs are welcome. You can provide your feedback or drop us a support
request at [hello@uploadcare.com][uc-email-hello].

[uc-email-bounty]: mailto:bugbounty@uploadcare.com
[uc-email-hello]: mailto:hello@uploadcare.com
[github-releases]: https://github.com/uploadcare/uploadcare-js-upload-api/releases
[github-branch-release]: https://github.com/uploadcare/uploadcare-js-upload-api/tree/release
[github-contributors]: https://github.com/uploadcare/uploadcare-js-upload-api/graphs/contributors
[badge-stack-img]: https://img.shields.io/badge/tech-stack-0690fa.svg?style=flat
[badge-stack-url]: https://stackshare.io/uploadcare/stacks/
[badge-release-img]: https://img.shields.io/github/release/uploadcare/uploadcare-js-upload-api.svg
[badge-release-url]: https://github.com/uploadcare/uploadcare-js-upload-api/releases
[npm-img]: http://img.shields.io/npm/v/@uploadcare/upload-api.svg
[npm-url]: https://www.npmjs.org/package/@uploadcare/upload-api
