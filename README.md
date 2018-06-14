# Uploadcare Javascript API

<a href="https://uploadcare.com/?utm_source=github&utm_campaign=uploadcare-javascript">
  <img align="right" width="64" height="64"
    src="https://ucarecdn.com/2f4864b7-ed0e-4411-965b-8148623aa680/uploadcare-logo-mark.svg"
    alt="">
</a>

:bangbang: This project is in alpha. The API will be changed. Do not use it. Really. :bangbang:

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
npm install @uploadcare/api --save
```

## Usage

```javascript
import {UploadAPI} from '@uploadcare/api'

UploadAPI.request(method, path, {query, body})
UploadAPI.base(file, {publicKey, store})
UploadAPI.fromUrl(url, {publicKey, store, fileName})
UploadAPI.fromUrlStatus(token)
UploadAPI.group([uuids], {publicKey})
UploadAPI.groupInfo(groupId, {publicKey})
UploadAPI.info(uuid, {publicKey})
UploadAPI.multipartStart({publicKey, filename, size})
UploadAPI.multipartUpload(partUrl, data)
UploadAPI.multipartComplete(uuid, {publicKey})
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
[github-releases]: https://github.com/uploadcare/uploadcare-javascript/releases
[github-branch-release]: https://github.com/uploadcare/uploadcare-javascript/tree/release
[github-contributors]: https://github.com/uploadcare/uploadcare-javascript/graphs/contributors
[badge-stack-img]: https://img.shields.io/badge/tech-stack-0690fa.svg?style=flat
[badge-stack-url]: https://stackshare.io/uploadcare/stacks/
[badge-release-img]: https://img.shields.io/github/release/uploadcare/uploadcare-javascript.svg
[badge-release-url]: https://github.com/uploadcare/uploadcare-javascript/releases
[npm-img]: http://img.shields.io/npm/v/@uploadcare/api.svg
[npm-url]: https://www.npmjs.org/package/@uploadcare/api
