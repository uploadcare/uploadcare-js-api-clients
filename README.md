# Uploadcare Upload Client

<a href="https://uploadcare.com/?utm_source=github&utm_campaign=uploadcare-upload-client">
  <img align="right" width="64" height="64"
    src="https://ucarecdn.com/2f4864b7-ed0e-4411-965b-8148623aa680/uploadcare-logo-mark.svg"
    alt="">
</a>

Library for work with Uploadcare Upload API.

[![NPM version][npm-img]][npm-url]
[![GitHub release][badge-release-img]][badge-release-url]&nbsp;
[![Uploadcare stack on StackShare][badge-stack-img]][badge-stack-url]

* [Install](#install)
* [Usage](#usage)
* [Security issues](#security-issues)
* [Feedback](#feedback)

## Install

```bash
npm install @uploadcare/upload-client --save
```

## Usage

```javascript
import UploadClient from '@uploadcare/upload-client'

const client = new UploadClient(settings)

client.api.request(options)
  .then(response => console.log(response.data))

const uploading = client.api.base(file, settings)

uploading.promise.then(data => console.log(data.file))
uploading.onProgress = (progressEvent) => console.log(progressEvent.loaded)

const file = client.fileFrom('object', file, settings)

file.promise
  .then(fileInfo => console.log(fileInfo.uuid))
```

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
[github-releases]: https://github.com/uploadcare/uploadcare-upload-client/releases
[github-branch-release]: https://github.com/uploadcare/uploadcare-upload-client/tree/release
[github-contributors]: https://github.com/uploadcare/uploadcare-upload-client/graphs/contributors
[badge-stack-img]: https://img.shields.io/badge/tech-stack-0690fa.svg?style=flat
[badge-stack-url]: https://stackshare.io/uploadcare/stacks/
[badge-release-img]: https://img.shields.io/github/release/uploadcare/uploadcare-upload-client.svg
[badge-release-url]: https://github.com/uploadcare/uploadcare-upload-client/releases
[npm-img]: http://img.shields.io/npm/v/@uploadcare/upload-client.svg
[npm-url]: https://www.npmjs.org/package/@uploadcare/upload-client
