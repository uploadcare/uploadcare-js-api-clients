# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]


[Unreleased]: https://github.com/uploadcare/uploadcare-upload-client/compare/v1.0.0.alpha...HEAD

## 1.0.0.alpha

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
