# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## Added

* Support `fileFrom` 'uploaded' file (uuid)
* Support of `waiting` status from `/from_url/status/` endpoint.

## Fixed

* Default timeout for polling functions increased from 3s to 10s.
* Removed restrictions for timeout and interval.

[Unreleased]: https://github.com/uploadcare/uploadcare-upload-client/compare/v1.0.0-alpha.2...HEAD

## [1.0.0-alpha.2]

### Changed

* Project was moved from Flow notations to TypeScript.
* The `base` function now returns object that implements `DirectUploadInterface`.
* The `fileFrom` function now returns object that implements `UploadFromInterface`.
* The `UCFile` type renamed to `UploadcareFile`.
* The progress of `fileFrom` now based on the `UploadingProgress` type.

### Added

* Low-level request wrappers for `/from_url/` and `/from_url/status/` paths of Upload API.
* Settings: the support of setting `baseCDN`, `checkForUrlDuplicates`, `saveUrlForRecurrentUploads`.

[1.0.0-alpha.2]: https://github.com/uploadcare/uploadcare-upload-client/compare/v1.0.0-alpha.1...v1.0.0-alpha.2

## [1.0.0-alpha.1]

### Fixed

* Use the version from the `package.json` file to create Uploadcare User Agent.

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
