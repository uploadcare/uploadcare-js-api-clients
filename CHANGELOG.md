## [1.0.2](https://github.com/uploadcare/uploadcare-upload-client/compare/v1.0.1...v1.0.2) (2020-01-27)



## [1.0.1](https://github.com/uploadcare/uploadcare-upload-client/compare/v1.0.0...v1.0.1) (2020-01-13)


### Bug Fixes

* **deps:** update dependency form-data to v3 ([#130](https://github.com/uploadcare/uploadcare-upload-client/issues/130)) ([1ece271](https://github.com/uploadcare/uploadcare-upload-client/commit/1ece271d8583ba257011d16b3f1930ad29329a96))



# [1.0.0](https://github.com/uploadcare/uploadcare-upload-client/compare/v1.0.0-alpha.5...v1.0.0) (2019-12-23)

### Changed

- All methods return a `Promise` now instead of `ThenableInterface`
- `SettingsInterface` was renamed to `Settings`
- `fileFrom` was renamed to `uploadFile`.
- `groupFrom` was renamed to `uploadFileGroup`.
- `request` low-level API method is not exported outside now.
- Method `setSettings` of `UploadClient` was renamed to `updateSettings`.
- Methods (`base`, `fromUrl`, `fromUrlStatus`, `group`,
  `groupInfo`, `info`, `multipartStart`, `multipartUpload`,
  `multipartComplete`, `multipart`, `uploadFile`, `uploadGroup`) were exported
  from `index.ts` to make the tree shaking better.
- Methods (`base`, `fromUrl`, `fromUrlStatus`, `group`,
  `groupInfo`, `info`, `multipartStart`, `multipartUpload`,
  `multipartComplete`, `multipart`, `uploadFile`, `uploadGroup`) accept
  `options` instead of `settings` as a second argument.
- `UploadClient` now contains all low-level API methods (`base`,
  `fromUrl`, `fromUrlStatus`, `group`, `groupInfo`, `info`,
  `multipartStart`, `multipartUpload`, `multipartComplete`, `multipart`,
  `fileFrom`, `groupFrom`).
- `UploadcareGroup` files now contain `UploadcareFile[]`, but not `FileInfo[]`.
- `README.md` was updated according to library API.
- `FileData` became `NodeFile` and `BrowserFile`.

### Removed

- `UploadAPI` class.
- `Thenable`, `CancelableThenable`, `BaseThenable`, `Upload` classes
  implementing respective interfaces.
- `onReady`, `onUploaded` callbacks.
- `addUpdateSettingsListener` and `removeUpdateSettingsListener` from
  `UploadClientInterface`.
- `from` param of `uploadFile` and `uploadFileGroup`.
- `FileFromEnum` and `GroupFromEnum`.

### Added

- `CancelController` to make API calls cancellable. See README for how
  to use this feature. ([#77](https://github.com/uploadcare/uploadcare-upload-client/issues/77))

## [1.0.0-alpha.5]

### Added

- Support of multipart and big files uploading: `multipartStart`,
  `multipartUpload`, and `multipartComplete` methods to `UploadAPI`.
- Support of canceling uploads and handling them for all API methods
  (`info`, `fromUrl`, `fromUrlStatus`, `group`, `groupInfo`).
- `DefaultSettingsInterface` with required properties.
- `pollingTimeoutMilliseconds` to `SettingsInterface`.
  Now you can adjust the timeout for checking is file ready,
  and checking is file being uploaded from URL.
- `maxConcurrentRequests` setting that allows you to specify the number
  of concurrent requests.

### Changed

- `FileFrom` enum was renamed to `FileFromEnum`.
- `GroupFrom` enum was renamed to `GroupFromEnum`.
- `Settings` was renamed to `SettingsInterface`.
- `FileInfo` was renamed to `FileInfoInterface`.
- `GroupInfo` was renamed to `GroupInfoInfoInterface`.
- `OriginalImageInfo` was renamed to `OriginalImageInfoInterface`.
- `RequestOptions` was renamed to `RequestOptionsInterface`.
- `ProgressStatus` was renamed to `ProgressStatusInterface`.
- `Audio` type was renamed to `AudioInterface`.
- `Video` type was renamed to `VideoInterface`.
- `ErrorRequestInfo` type was renamed to `ErrorRequestInfoInterface`.
- `ErrorResponseInfoInfo` type was renamed to `ErrorResponseInfoInterface`.
- `ProgressState` was renamed to `ProgressStateEnum`.
- `ProgressParams` was renamed to `ProgressParamsInterface`.
- `base` method of Upload API now returns `BaseThenableInterface<BaseResponse>`
  instead of `DirectUploadInterface`.
- `info`, `fromUrl`, `fromUrlStatus`, `group`, `groupInfo` now returns
  `CancelableThenableInterface`.
- Progress is now calculated from 0 to 1 instead of 0 to 100

### Fixed

- Example with `directUpload.onProgress` in `README.md`.
- All tests are passing now.
- Mock server tests are passing now.

### Removed

- `DirectUploadInterface` was removed in favor of `BaseThenableInterface<BaseResponse>`.
- `BaseProgress` was removed in favor of native `ProgressEvent`.
- `InfoResponse` was removed in favor of `FileInfoInterface`.
- Old code in folder `./.back`.

[1.0.0-alpha.5]: https://github.com/uploadcare/uploadcare-upload-client/compare/v1.0.0-alpha.4...v1.0.0-alpha.5

## [1.0.0-alpha.4]

### Added

- Wrappers for group paths of Upload API (`group`, `groupInfo`).
- The high-level function for group uploading, aka filesGroupFrom.
- Uploading progress for Node.js in the `base` method.

### Changed

- `UploadFromInterface` was renamed to `FileUploadInterface`.
- `FileProgress` was renamed to `ProgressParams`.
- `UploadcareFile` was renamed to `UploadcareFileInterface`.

[1.0.0-alpha.4]: https://github.com/uploadcare/uploadcare-upload-client/compare/v1.0.0-alpha.3...v1.0.0-alpha.4

## [1.0.0-alpha.3]

### Added

- Support `fileFrom` 'uploaded' file (`uuid`).
- Support of `waiting` status from `/from_url/status/` endpoint.
- Export some main types from the `index.ts` file.
  So you can import them now directly from `@uploadcare/upload-client`.
- Throttling for `request`.
- `retryThrottledMaxTimes` param to set count of max retries after
  throttled request (1 by default).
- `Uuid` type.
- Mock server for local testing.

### Fixed

- The default timeout for polling functions increased from 3s to 10s.
- Removed restrictions for timeout and interval.

[1.0.0-alpha.3]: https://github.com/uploadcare/uploadcare-upload-client/compare/v1.0.0-alpha.2...v1.0.0-alpha.3

## [1.0.0-alpha.2]

### Changed

- The project was moved from Flow notations to TypeScript.
- The `base` function now returns an object that implements
  `DirectUploadInterface`.
- The `fileFrom` function now returns an object that implements
  `UploadFromInterface`.
- The `UCFile` type renamed to `UploadcareFile`.
- The progress of `fileFrom` now based on the `UploadingProgress` type.

### Added

- Low-level request wrappers for `/from_url/` and `/from_url/status/`
  paths of Upload API.
- Settings: the support of setting `baseCDN`, `checkForUrlDuplicates`,
  `saveUrlForRecurrentUploads`.

[1.0.0-alpha.2]: https://github.com/uploadcare/uploadcare-upload-client/compare/v1.0.0-alpha.1...v1.0.0-alpha.2

## [1.0.0-alpha.1]

### Fixed

- Use the version from the `package.json` file to create Uploadcare User
  Agent.

### Changed

- The `base` function returns `thenable` object called `DirectUpload`
  instead of using the `promise` property.
- The `fileFrom` function returns `thenable` object called `FilePromise`
  instead of using the `promise` property.
- The `FileInfo` type renamed to `UCFile` and updated.
- The `FilePromise` resolved with an object of the `UploadcareFile` type.
- The progress of `fileFrom` now based on the `FilePromiseProgress` type.
- Updated the `InfoResponse` type.

### Added

- The `checkFileIsReady` function to check if the file is ready on the CDN.
- New properties for the object that the `fileFrom` function returns:
  `onUploaded`, `onReady`.
- The `camelizeKeys` function for inner usage.
- The `baseCDN` default setting

[1.0.0-alpha.1]: https://github.com/uploadcare/uploadcare-upload-client/compare/v1.0.0-alpha...v1.0.0-alpha.1

## 1.0.0-alpha

The first public alpha release.

### Added

- The `request` function to request to any path of [Upload API][upload-api].
- Low-level request wrappers for `/base/` and `/info/` paths of Upload API.
- `UploadClient` class with settings and `fileFrom` method that supports
  only direct uploads now.
- Support of following Uploadcare Settings: `publicKey`, `baseUrl`,
  `doNotStore`, `integration`, `secureExpire`, `secureSignature`.
- Test environment for both Node.js and browsers

[upload-api]: https://uploadcare.com/docs/api_reference/upload/
