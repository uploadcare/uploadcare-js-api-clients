# Uploadcare Upload Client

<a href="https://uploadcare.com/?utm_source=github&utm_campaign=uploadcare-upload-client">
  <img align="right" width="64" height="64"
    src="https://ucarecdn.com/2f4864b7-ed0e-4411-965b-8148623aa680/uploadcare-logo-mark.svg"
    alt="">
</a>

Library for work with Uploadcare [Upload API][uc-docs-upload-api] in Node.js and browsers.

[![Build Status](https://travis-ci.org/uploadcare/uploadcare-upload-client.svg?branch=master)](https://travis-ci.org/uploadcare/uploadcare-upload-client)
[![NPM version][npm-img]][npm-url]
[![GitHub release][badge-release-img]][badge-release-url]&nbsp;
[![Uploadcare stack on StackShare][badge-stack-img]][badge-stack-url]

<!-- toc -->

* [Install](#install)
* [Usage](#usage)
* [Testing](#testing)
* [Security issues](#security-issues)
* [Feedback](#feedback)

<!-- tocstop -->

## Install

```bash
npm install @uploadcare/upload-client --save
```

## Usage

```javascript
import UploadClient from '@uploadcare/upload-client'
import {FileFrom} from '@uploadcare/upload-client'

const client = new UploadClient({publicKey: 'YOUR_PUBLIC_KEY'})

client.api.request({path: 'info', query})
  .then(response => console.log(response.data))

client.api.info(uuid)
  .then(data => console.log(data.is_image))

const directUpload = client.api.base(fileData)

directUpload
  .then(data => console.log(data.file))

directUpload.onProgress = (progressEvent) => console.log(progressEvent.total / progressEvent.loaded)

const fileUpload = client.fileFrom(FileFrom.Object, fileData)

fileUpload
  .then(file => console.log(file.uuid))

fileUpload.onProgress = (progress => {
  console.log(progress.state)
  console.log(progress.uploaded.total / progress.uploaded.loaded)
  console.log(progress.value)
})
```

## Testing 

By default testing environment is local and for this you need to start a mock server for local tests.

To start a mock server you need to run next command:

```
npm run mock:start
```

and after that you can run:

```
npm run test
```

If you want to run tests on production servers you need to set `NODE_ENV` as `production`:

```
NODE_ENV=production npm run test
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
[uc-docs-upload-api]: https://uploadcare.com/docs/api_reference/upload/?utm_source=github&utm_campaign=uploadcare-upload-client
