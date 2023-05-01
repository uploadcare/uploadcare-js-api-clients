# Uploadcare Upload Client

<a href="https://uploadcare.com/?utm_source=github&utm_campaign=uploadcare-js-api-clients">
    <img align="right" width="64" height="64"
      src="https://ucarecdn.com/edfdf045-34c0-4087-bbdd-e3834921f890/userpiccircletransparent.svg"
      alt="">
</a>

This is an Uploadcare [Upload API][uc-docs-upload-api] wrapper to work with
Node.js and browser.

[API Reference](https://uploadcare.github.io/uploadcare-js-api-clients/upload-client/)

[![Build Status][badge-build]][build-url]
[![NPM version][npm-img]][npm-url]
[![GitHub release][badge-release-img]][badge-release-url]&nbsp;
[![Uploadcare stack on StackShare][badge-stack-img]][badge-stack-url]

<!-- toc -->

- [Install](#install)
- [Usage](#usage)
  - [High-Level API](#high-level-api)
  - [Low-Level API](#low-level-api)
  - [Settings](#settings)
  - [Uploading queue](#uploading-queue)
- [React Native](#react-native)
- [Testing](#testing)
- [Security issues](#security-issues)
- [Feedback](#feedback)

<!-- tocstop -->

## Install

```bash
npm install @uploadcare/upload-client
```

## Usage

### High-Level API

To access the High-Level API, you need to create an instance of `UploadClient`
providing the necessary settings. Specifying `YOUR_PUBLIC_KEY` is mandatory: it
points to the specific Uploadcare project:

```javascript
import { UploadClient } from '@uploadcare/upload-client'

const client = new UploadClient({ publicKey: 'YOUR_PUBLIC_KEY' })
```

Once the UploadClient instance is created, you can start using the wrapper to
upload files from binary data:

```javascript
client.uploadFile(fileData).then((file) => console.log(file.uuid))
```

Another option is uploading files from URL, via the `uploadFile` method:

```javascript
const fileURL = 'https://example.com/file.jpg'

client.uploadFile(fileURL).then((file) => console.log(file.uuid))
```

You can also use the `uploadFile` method to get previously uploaded files via
their UUIDs:

```javascript
const fileUUID = 'edfdf045-34c0-4087-bbdd-e3834921f890'

client.uploadFile(fileUUID).then((file) => console.log(file.uuid))
```

You can track uploading progress:

```javascript
const fileUUID = 'edfdf045-34c0-4087-bbdd-e3834921f890'
const onProgress = ({ isComputable, value }) => {
  console.log(isComputable, value)
}

client
  .uploadFile(fileUUID, { onProgress })
  .then((file) => console.log(file.uuid))
```

Note that `isComputable` flag can be `false` is some cases of uploading from the URL.
If we can't calculate the file size, progress info will look like `{ isComputable: false }` without a `value`.
Successful uploading progress will be always `{ isComputable: true, value: 1 }`.

You can cancel file uploading and track this event:

```javascript
const fileUUID = 'edfdf045-34c0-4087-bbdd-e3834921f890'
const abortController = new AbortController()

client
  .uploadFile(fileUUID, { signal: abortController.signal })
  .then((file) => console.log(file.uuid))
  .catch((error) => {
    if (error.isCancel) {
      console.log(`File uploading was canceled.`)
    }
  })

// Cancel uploading
abortController.abort()
```

List of all available `UploadClient` API methods:

```typescript
interface UploadClient {
  updateSettings(newSettings: Settings = {}): void

  getSettings(): Settings

  base(
    file: Blob | File | Buffer | ReactNativeAsset,
    options: BaseOptions
  ): Promise<BaseResponse>

  info(uuid: Uuid, options: InfoOptions): Promise<FileInfo>

  fromUrl(sourceUrl: Url, options: FromUrlOptions): Promise<FromUrlResponse>

  fromUrlStatus(
    token: Token,
    options: FromUrlStatusOptions
  ): Promise<FromUrlStatusResponse>

  group(uuids: Uuid[], options: GroupOptions): Promise<GroupInfo>

  groupInfo(id: GroupId, options: GroupInfoOptions): Promise<GroupInfo>

  multipartStart(
    size: number,
    options: MultipartStartOptions
  ): Promise<MultipartStartResponse>

  multipartUpload(
    part: Buffer | Blob,
    url: MultipartPart,
    options: MultipartUploadOptions
  ): Promise<MultipartUploadResponse>

  multipartComplete(
    uuid: Uuid,
    options: MultipartCompleteOptions
  ): Promise<FileInfo>

  uploadFile(
    data: Blob | File | Buffer | ReactNativeAsset | Url | Uuid,
    options: FileFromOptions
  ): Promise<UploadcareFile>

  uploadFileGroup(
    data: (Blob | File | Buffer | ReactNativeAsset)[] | Url[] | Uuid[],
    options: FileFromOptions & GroupFromOptions
  ): Promise<UploadcareGroup>
}
```

You can import only needed methods directly, without `UploadClient` wrapper:

```javascript
import {
  uploadFile,
  uploadFromUrl,
  uploadDirect,
  uploadFromUploaded,
  uploadMultipart,
  uploadFileGroup
} from '@uploadcare/upload-client'
```

### Low-Level API

Also, you can use low-level wrappers to call the API endpoints directly:

```javascript
import { base } from '@uploadcare/upload-client'

const onProgress = ({ isComputable, value }) => console.log(isComputable, value)
const abortController = new AbortController()

base(fileData, { onProgress, signal: abortController.signal }) // fileData must be `Blob` or `File` or `Buffer`
  .then((data) => console.log(data.file))
  .catch((error) => {
    if (error.isCancel) {
      console.log(`File uploading was canceled.`)
    }
  })

// Also you can cancel upload:
abortController.abort()
```

List of all available API methods:

```typescript
base(
  file: Blob | File | Buffer | ReactNativeAsset,
  options: BaseOptions
): Promise<BaseResponse>
```

```typescript
info(uuid: Uuid, options: InfoOptions): Promise<FileInfo>
```

```typescript
fromUrl(sourceUrl: Url, options: FromUrlOptions): Promise<FromUrlResponse>
```

```typescript
fromUrlStatus(
  token: Token,
  options: FromUrlStatusOptions
): Promise<FromUrlStatusResponse>
```

```typescript
group(uuids: Uuid[], options: GroupOptions): Promise<GroupInfo>
```

```typescript
groupInfo(id: GroupId, options: GroupInfoOptions): Promise<GroupInfo>
```

```typescript
multipartStart(
  size: number,
  options: MultipartStartOptions
): Promise<MultipartStartResponse>
```

```typescript
multipartUpload(
  part: Buffer | Blob | File,
  url: MultipartPart,
  options: MultipartUploadOptions
): Promise<MultipartUploadResponse>
```

```typescript
multipartComplete(
  uuid: Uuid,
  options: MultipartCompleteOptions
): Promise<FileInfo>
```

### Settings

#### `publicKey: string`

The main use of a `publicKey` is to identify a target project for your uploads.
It is required when using Upload API.

#### `baseCDN: string`

Defines your schema and CDN domain. Can be changed to one of the predefined
values (`https://ucarecdn.com/`) or your custom CNAME.

Defaults to `https://ucarecdn.com/`.

#### `baseURL: string`

API base URL.

Defaults to `https://upload.uploadcare.com`

#### `fileName: string`

You can specify an original filename.
It could useful when file input does not contain filename.

Defaults to `original`.

#### `store: boolean`

Forces files uploaded with `UploadClient` to be stored or not. For instance,
you might want to turn this off when automatic file storing is enabled in your
project, but you do not want to store files uploaded with a particular instance.

#### `secureSignature: string`

In case you enable signed uploads for your project, you’d need to provide
the client with `secureSignature` and `secureExpire` params.

The `secureSignature` is an MD5 hex-encoded hash from a concatenation
of `API secret key` and `secureExpire`.

#### `secureExpire: string`

Stands for the Unix time to which the signature is valid, e.g., `1454902434`.

#### `userAgent: string | CustomUserAgentFn`

```typescript
type CustomUserAgentOptions = {
  publicKey: string
  libraryName: string
  libraryVersion: string
  languageName: string
  integration?: string
}

type CustomUserAgentFn = (options: CustomUserAgentOptions) => string
```

`X-UC-User-Agent` header value.

Defaults to `UploadcareUploadClient/${version}/${publicKey} (JavaScript; ${integration})`

#### `integration: string`

Integration value passed to the `X-UC-User-Agent` header.
May be overrided with the custom user agent string or function.

#### `checkForUrlDuplicates: boolean`

Runs the duplicate check and provides the immediate-download behavior.

#### `saveUrlForRecurrentUploads: boolean`

Provides the save/update URL behavior. The parameter can be used if you believe
that the `sourceUrl` will be used more than once. Using the parameter also
updates an existing reference with a new `sourceUrl` content.

#### `source: string`

Defines the upload source to use, can be set to local, url, etc.

#### `jsonpCallback: string`

Sets the name of your JSONP callback function to create files group from a set
of files by using their UUIDs.

#### `maxContentLength: number`

`maxContentLength` defines the maximum allowed size (in bytes) of the HTTP
response content.

Defaults to `52428800` bytes (50 MB).

#### `retryThrottledRequestMaxTimes: number`

Sets the maximum number of attempts to retry throttled requests.

Defaults to `1`.

#### `retryNetworkErrorMaxTimes: number`

Sets the maximum number of attempts to retry requests that failed with a network error.

Defaults to `3`.

The delay between attempts equals attempt number, i.e.

- first attempt - 1 second delay
- second attempt - 2 seconds delay
- third attempt - 3 seconds delay
- ...

#### `multipartChunkSize: number`

This option is only applicable when handling local files.
Sets the multipart chunk size.

Defaults to `5242880` bytes (5 MB).

#### `multipartMinFileSize: number`

This option is only applicable when handling local files.
Sets the multipart uploading file size threshold: larger files
will be uploaded in the Multipart mode rather than via Direct Upload.
The value is limited to the range from `10485760` (10 MB) to `104857600` (100 MB).

Defaults to `26214400` (25 MB).

#### `multipartMinLastPartSize: number`

This option is only applicable when handling local files. Set the minimum size
of the last multipart part.

Defaults to `1048576` bytes (1 MB).

#### `maxConcurrentRequests: number`

Allows specifying the number of concurrent requests.

Defaults to `4`.

### `contentType: string`

This option is useful when file input does not contain content type.

Defaults to `application/octet-stream`.

### `metadata: Metadata`

```typescript
type Metadata = {
  [key: string]: string
}
```

Metadata is additional, arbitrary data, associated with uploaded file.

Non-string values will be converted to `string`. `undefined` values will be ignored.

See [docs][uc-file-metadata] and [REST API][uc-docs-metadata] for details.

### Uploading queue

If you're going to upload a lot of files at once, it's useful to do it in a queue. Otherwise, a large number of simultaneous requests can clog the internet channel and slow down the process.

To solve this problem, we provide a simple helper called `Queue`.

Here is an example of how to use it:

```typescript
import { Queue, uploadFile } from '@uploadcare/upload-client'

// Create a queue with a limit of 10 concurrent requests.
const queue = new Queue(10)

// Create an array containing 50 files.
const files = [
  ...Array(50)
    .fill(0)
    .map((_, idx) => Buffer.from(`content-${idx}`))
]
const promises = files.map((file, idx) => {
  const fileName = `file-${idx}.txt`
  return queue
    .add(() =>
      uploadFile(file, {
        publicKey: 'YOUR_PUBLIC_KEY',
        contentType: 'plain/text',
        fileName
      })
    )
    .then((fileInfo) =>
      console.log(
        `"File "${fileName}" has been successfully uploaded! You can access it at the following URL: "${fileInfo.cdnUrl}"`
      )
    )
})

await Promise.all(promises)

console.log('Files have been successfully uploaded')
```

You can pass any function that returns a promise to `queue.add`, and it will be executed concurrently.

`queue.add` returns a promise that mimics the one passed in, meaning it will resolve or reject with the corresponding values.

If the functionality of the built-in `Queue` is not sufficient for you, you can use any other third-party, more functional solution.


## React Native

### Prepare

To be able to use `@uploadcare/upload-client` with React Native, you need to
install [react-native-url-polyfill][react-native-url-polyfill].

To prevent [`Error: Cannot create URL for blob`][react-native-url-polyfill-issue]
errors you need to configure your Android app schema to accept blobs -
have a look at this pull request for an example: [5985d7e][react-native-url-polyfill-example].

1. Add the following code to the `application` section of your `AndroidManifest.xml`:

```xml
<provider
  android:name="com.facebook.react.modules.blob.BlobProvider"
  android:authorities="@string/blob_provider_authority"
  android:exported="false"
/>
```

2. Add the following code to the `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
  <string name="app_name">MY_REACT_NATIVE_APP_NAME</string>
  <string name="blob_provider_authority">com.detox.blob</string>
</resources>
```

### Usage

You can use `ReactNativeAsset` as an input to the `@uploadcare/upload-client` like this:

```ts
type ReactNativeAsset = {
  uri: string
  type: string
  name?: string
}
```

```ts
const asset = { uri: 'URI_TO_FILE', name: 'file.txt', type: 'text/plain' }
uploadFile(asset, { publicKey: 'YOUR_PUBLIC_KEY' })
```

Or `Blob` like this:

```ts
const uri = 'URI_TO_FILE'
const blob = await fetch(uri).then((res) => res.blob())
uploadFile(blob, {
  publicKey: 'YOUR_PUBLIC_KEY',
  fileName: 'file.txt',
  contentType: 'text/plain'
})
```

## Testing

```
npm run test
```

By default, tests runs with mock server, but you can run tests with
production environment.

Run test on production servers:

```bash
npm run test:production
```

Run test with mock server (mock server starts automaticaly):

```bash
npm run test
```

Run mock server:

```
npm run mock:start
```

And then you can run test:

```
npm run test:jest
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
[uc-docs-metadata]: https://uploadcare.com/api-refs/rest-api/v0.7.0/#tag/File-Metadata
[uc-file-metadata]: https://uploadcare.com/docs/file-metadata/
[react-native-url-polyfill]: https://github.com/charpeni/react-native-url-polyfill
[react-native-url-polyfill-issue]: https://github.com/charpeni/react-native-url-polyfill/issues/284
[react-native-url-polyfill-example]: https://github.com/charpeni/react-native-url-polyfill/commit/5985d7efc07b496b829883540d09c6f0be384387
