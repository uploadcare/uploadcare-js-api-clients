# Uploadcare Upload Client

<a href="https://uploadcare.com/?utm_source=github&utm_campaign=uploadcare-upload-client">
    <img align="right" width="64" height="64"
      src="https://ucarecdn.com/edfdf045-34c0-4087-bbdd-e3834921f890/userpiccircletransparent.svg"
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
* [Usage](#usage)
 * [High Level API](#high-level-api)
 * [Middle Level API](#middle-level-api)
 * [Low Level API](#low-level-api)
 * [Settings](#settings)
* [Testing](#testing)
* [Security issues](#security-issues)
* [Feedback](#feedback)

<!-- tocstop -->

## Install

```bash
npm install @uploadcare/upload-client --save
```

## Usage

### High Level API

To get access to High Level API you need to create 
an instance of `UploadClient` and provide settings to him:

```javascript
import UploadClient from '@uploadcare/upload-client'
import {FileFromEnum} from '@uploadcare/upload-client'

const client = new UploadClient({publicKey: 'YOUR_PUBLIC_KEY'})
```

After that you can upload file from binary data:

```javascript
const fileUpload = client.fileFrom(FileFromEnum.Object, fileData)

fileUpload
  .then(file => console.log(file.uuid))
```

Or from URL with file:

```javascript
const fileURL = 'https://example.com/file.jpg'
const fileUpload = client.fileFrom(FileFromEnum.URL, fileURL)

fileUpload
  .then(file => console.log(file.uuid))
```

Or even from `uploaded` before to Uploadcare file:
```javascript
const fileUUID = 'edfdf045-34c0-4087-bbdd-e3834921f890'
const fileUpload = client.fileFrom(FileFromEnum.Uploaded, fileUUID)

fileUpload
  .then(file => console.log(file.uuid))
```

You can track uploading progress:
```javascript
fileUpload.onProgress = (progress => {
  console.log(progress.state)
  console.log(progress.uploaded.loaded / progress.uploaded.total)
  console.log(progress.value)
})
```

Or set callback function that will be called when file was uploaded:
```javascript
fileUpload.onUploaded = (uuid => console.log(`File "${uuid}" was uploaded.`))
```

Or when file is ready on CDN:
```javascript
fileUpload.onReady = (file => console.log(`File "${file.uuid}" is ready on CDN.`))
```

You can cancel file uploading and track this event:
```javascript
// Set callback
fileUpload.onCancel = (() => console.log(`File uploading was canceled.`))

// Cancel uploading
fileUpload.cancel()
```

### Middle Level API

Also, you can use wrappers around low level to call the API endpoints:

```javascript
import UploadClient from '@uploadcare/upload-client'

const client = new UploadClient({publicKey: 'YOUR_PUBLIC_KEY'})
const api = client.api
const directUpload = api.base(fileData) // fileData must be `Blob` or `File` or `Buffer`

directUpload
  .then(data => console.log(data.file))

directUpload.onProgress = (progressEvent) => console.log(progressEvent.loaded / progressEvent.total)

// Also you can cancel upload:
directUpload.cancel()

// and set callback to track cancel event:
directUpload.onCancel = () => console.log('File upload was canceled.') 
```

List of all available low level API methods:

```typescript
interface UploadAPIInterface {
  request(options: RequestOptionsInterface): Promise<RequestResponse>

  base(data: FileData, settings?: SettingsInterface): BaseThenableInterface<BaseResponse>

  info(uuid: Uuid, settings?: SettingsInterface): CancelableThenableInterface<FileInfoInterface>

  fromUrl(sourceUrl: Url, settings?: SettingsInterface): CancelableThenableInterface<FromUrlResponse>

  fromUrlStatus(token: Token, settings?: SettingsInterface): CancelableThenableInterface<FromUrlStatusResponse>

  group(files: Uuid[], settings: SettingsInterface): CancelableThenableInterface<GroupInfoInterface>

  groupInfo(id: GroupId, settings: SettingsInterface): CancelableThenableInterface<GroupInfoInterface>

  multipartStart(file: FileData, settings: SettingsInterface): CancelableThenableInterface<MultipartStartResponse>

  multipartUpload(file: FileData, parts: MultipartPart[], settings: SettingsInterface): BaseThenableInterface<any>

  multipartComplete(uuid: Uuid, settings: SettingsInterface): CancelableThenableInterface<FileInfoInterface>
}
```

### Low Level API

If you want to use our low level API, you can do that something like this:

```javascript
import UploadClient from '@uploadcare/upload-client'

const client = new UploadClient({publicKey: 'YOUR_PUBLIC_KEY'})

client.api.request({path: 'info', query})
  .then(response => console.log(response.data))
```

### Settings

#### publicKey: string

The main use of a `publicKey` is to identify a target project for your uploads. 
It is required when using Upload API.

#### baseCDN: string

Defines your schema and CDN domain. Can be changed to one of 
the predefined values or your custom CNAME. 

Defaults to `https://ucarecdn.com/`.

#### baseURL: string

API base URL. 

Defaults to `https://upload.uploadcare.com`

#### fileName: string

You can specify an original filename. 

Defaults to `original`.

#### doNotStore: boolean

Forces files uploaded with a widget not to be stored. 
For instance, you might want to turn this on when automatic file storing 
is enabled in your project, but you do not want to store files uploaded 
with a particular instance.

#### secureSignature: string

In case you enable signed uploads for your project, you’d need to provide 
the client with signature and expire. 

The `secureSignature` is an MD5 hex-encoded hash from a concatenation 
of `API secret key` and `secureExpire`.

#### secureExpire: string

Stands for the Unix time to which the signature is valid, e.g., `1454902434`.

#### integration: string

`X-UC-User-Agent` header value.

Defaults to `UploadcareUploadClient/${version}${publicKey} (JavaScript${integration})`

#### checkForUrlDuplicates: boolean

Runs the duplicate check and provides the immediate-download behavior.

#### saveUrlForRecurrentUploads: boolean

Provides the save/update URL behavior. The parameter can be used 
if you believe a `sourceUrl` will be used more than once. 
Using the parameter also updates an existing reference with a new 
`sourceUrl` content.

#### source: string

Upload source. Each upload method has its own (as example: `local`, `url`, etc.)

#### jsonpCallback: string

Sets the name of your JSONP callback function to create files group from 
a set of files by using their UUIDs.

#### pollingTimeoutMilliseconds: number

Internally upload client using polling to ensure that file is available on CDN 
or its uploaded from url.

Defaults to `10000` milliseconds (10 seconds).

#### maxContentLength: number

`maxContentLength` defines the max size of the http response content 
in bytes allowed. 

Defaults to `52428800` bytes (50 MB).

#### retryThrottledRequestMaxTimes: number

Sets the maximum number of attempts to retry throttled request.

Defaults to `1`.

#### multipartChunkSize: number

This option is only applicable when handling local files.
Sets the multipart chunk size. 

Defaults to `5242880` bytes (5 MB).

#### multipartMinFileSize: number

This option is only applicable when handling local files. 
Sets the multipart uploading file size threshold. 
The value is limited to the range from `10485760` (10 MB) to `104857600` (100 MB). 

Defaults to `26214400` (25 MB).

#### multipartMinLastPartSize: number

This option is only applicable when handling local files.
Set the minimum size of the last multipart part.

Defaults to `1048576` bytes (1 MB).

#### maxConcurrentRequests: number

Setting that allows you to specify the number of concurrent requests.

Defaults to `4`.

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
