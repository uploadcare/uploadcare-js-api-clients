# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

[Unreleased]: https://github.com/uploadcare/uploadcare-upload-client/compare/v1.0.0-alpha.5...HEAD

### Changed

* Method `setSettings` of `UploadClientInterface` was renamed to `updateSettings`.

### Removed

* `addUpdateSettingsListener` and `removeUpdateSettingsListener` from 
`UploadClientInterface`.
* Removed `from` param from `fileFrom` and `groupFrom`. 
* Removed `FileFromEnum` and `GroupFromEnum`.

### Changed

* `README.md` was updated according to library API.

## [1.0.0-alpha.5]

### Added

* Support of multipart and uploading of big files: `multipartStart`, 
`multipartUpload` and `multipartComplete` methods to `UploadAPI`.
* Support of cancel and handling canceling uploads for all api methods
(`info`, `fromUrl`, `fromUrlStatus`, `group`, `groupInfo`).
* `DefaultSettingsInterface` with required properties.
* `pollingTimeoutMilliseconds` to `SettingsInterface`.
Now you can adjust the timeout for checking file is ready 
and checking file is uploaded from url.
* `maxConcurrentRequests` setting that allows you to specify the number 
of concurrent requests.

### Changed

* `FileFrom` enum was renamed to `FileFromEnum`.
* `GroupFrom` enum was renamed to `GroupFromEnum`.
* `Settings` was renamed to `SettingsInterface`. 
* `FileInfo` was renamed to `FileInfoInterface`.
* `GroupInfo` was renamed to `GroupInfoInfoInterface`.
* `OriginalImageInfo` was renamed to `OriginalImageInfoInterface`.
* `RequestOptions` was renamed to `RequestOptionsInterface`.
* `ProgressStatus` was renamed to `ProgressStatusInterface`.
* `Audio` type was renamed to `AudioInterface`.
* `Video` type was renamed to `VideoInterface`.
* `ErrorRequestInfo` type was renamed to `ErrorRequestInfoInterface`.
* `ErrorResponseInfoInfo` type was renamed to `ErrorResponseInfoInterface`.
* `ProgressState` was renamed to `ProgressStateEnum`.
* `ProgressParams` was renamed to `ProgressParamsInterface`.
* `base` method of Upload API now returns `BaseThenableInterface<BaseResponse>`
instead of `DirectUploadInterface`.
* `info`, `fromUrl`, `fromUrlStatus`, `group`, `groupInfo` now returns 
`CancelableThenableInterface`.
* Progress is now calculated from 0 to 1 instead of 0 to 100

### Fixed

* Example with `directUpload.onProgress` in `README.md`.
* All tests now passed.
* Mock server tests are now passed.

### Removed

* `DirectUploadInterface` was removed in favor of `BaseThenableInterface<BaseResponse>`.
* `BaseProgress` was removed in favor of native `ProgressEvent`.
* `InfoResponse` was removed in favor of `FileInfoInterface`.
* Old code in folder `./.back`.

[1.0.0-alpha.5]: https://github.com/uploadcare/uploadcare-upload-client/compare/v1.0.0-alpha.4...v1.0.0-alpha.5

## [1.0.0-alpha.4]

### Added

* Wrappers for group paths of Upload API (`group`, `groupInfo`).
* The high-level function for group uploading, aka filesGroupFrom.
* Uploading progress for Node.js in `base` method.

### Changed

* `UploadFromInterface` was renamed to `FileUploadInterface`.
* `FileProgress` was renamed to `ProgressParams`.
* `UploadcareFile` was renamed to `UploadcareFileInterface`.

[1.0.0-alpha.4]: https://github.com/uploadcare/uploadcare-upload-client/compare/v1.0.0-alpha.3...v1.0.0-alpha.4

## [1.0.0-alpha.3]

### Added

* Support `fileFrom` 'uploaded' file (`uuid`).
* Support of `waiting` status from `/from_url/status/` endpoint.
* Export some main types from `index.ts` file. 
  So you can import them now directly from `@uploadcare/upload-client`.
* Throttling for `request`.
* `retryThrottledMaxTimes` param to set count of max retries after 
  throttled request (1 by default).
* `Uuid` type.
* Mock server for local testing.

### Fixed

* Default timeout for polling functions increased from 3s to 10s.
* Removed restrictions for timeout and interval.

[1.0.0-alpha.3]: https://github.com/uploadcare/uploadcare-upload-client/compare/v1.0.0-alpha.2...v1.0.0-alpha.3

## [1.0.0-alpha.2]

### Changed

* Project was moved from Flow notations to TypeScript.
* The `base` function now returns object that implements 
  `DirectUploadInterface`.
* The `fileFrom` function now returns object that implements 
  `UploadFromInterface`.
* The `UCFile` type renamed to `UploadcareFile`.
* The progress of `fileFrom` now based on the `UploadingProgress` type.

### Added

* Low-level request wrappers for `/from_url/` and `/from_url/status/` 
  paths of Upload API.
* Settings: the support of setting `baseCDN`, `checkForUrlDuplicates`, 
  `saveUrlForRecurrentUploads`.

[1.0.0-alpha.2]: https://github.com/uploadcare/uploadcare-upload-client/compare/v1.0.0-alpha.1...v1.0.0-alpha.2

## [1.0.0-alpha.1]

### Fixed

* Use the version from the `package.json` file to create Uploadcare User 
  Agent.

### Changed

* The `base` function returns `thenable` object called `DirectUpload`
  instead of using the `promise` property.
* The `fileFrom` function returns `thenable` object called `FilePromise`
  instead of using the `promise` property.
* The `FileInfo` type renamed to `UCFile` and updated.
* The `FilePromise` resolved with an object of the `UploadcareFile` type.
* The progress of `fileFrom` now based on the `FilePromiseProgress` type.
* Updated the `InfoResponse` type.

### Added

* The `checkFileIsReady` function to check if the file is ready on the CDN.
* New properties for the object that the `fileFrom` function returns:
  `onUploaded`, `onReady`.
* The `camelizeKeys` function for inner usage.
* The `baseCDN` default setting

[1.0.0-alpha.1]: https://github.com/uploadcare/uploadcare-upload-client/compare/v1.0.0-alpha...v1.0.0-alpha.1

## 1.0.0-alpha

The first public alpha release.

### Added

* The `request` function to request to any path of [Upload API][upload-api].
* Low-level request wrappers for `/base/` and `/info/` paths of Upload API.
* `UploadClient` class with settings and `fileFrom` method that supports
  only direct uploads now.
* Support of following Uploadcare Settings: `publicKey`, `baseUrl`,
  `doNotStore`, `integration`, `secureExpire`, `secureSignature`.
* Test environment for both Node.js and browsers

[upload-api]: https://uploadcare.com/docs/api_reference/upload/
