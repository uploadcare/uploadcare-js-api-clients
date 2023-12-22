/** @see https://uploadcare.com/api-refs/upload-api/#tag/Errors */
export type ServerErrorCode =
  // Base upload errors:
  | 'AccountBlockedError' //	403	Account has been blocked.
  | 'AccountLimitsExceededError' //	403	Account has reached its limits.
  | 'AccountUnpaidError' //	403	Account has been blocked for non payment.
  | 'AutostoreDisabledError' //	403	Autostore is disabled.
  | 'BaseViewsError' //	400	Request processing failed.
  | 'FileMetadataKeyDuplicatedError' //	400	File's metadata key `%s` has a duplicate.
  | 'FileMetadataKeyEmptyError' //	400	File's metadata key can not be empty.
  | 'FileMetadataKeyForbiddenError' //	400	File's metadata key `%s` contains symbols not allowed by the metadata key format.
  | 'FileMetadataKeyLengthTooBigError' //	400	Length of file metadata key `%s` can not be more than %d symbols.
  | 'FileMetadataKeysNumberTooBigError' //	400	A file can not have more than %d metadata keys.
  | 'FileMetadataValueEmptyError' //	400	Value of the file metadata key `%s` can not be empty.
  | 'FileMetadataValueForbiddenError' //	400	Value of file metadata key `%s` contains symbols not allowed by the metadata value format.
  | 'FileMetadataValueLengthTooBigError' //	400	Value of file metadata's key `%s` can not be more than %d symbols in length.
  | 'FileSizeLimitExceededError' //	400	File is too large.
  | 'MethodNotAllowedError' //	405	HTTP method %s is not allowed for %s
  | 'NullCharactersForbiddenError' //	400	Null characters are not allowed.
  | 'PostRequestParserFailedError' //	400	HTTP POST request parsing failed.
  | 'ProjectPublicKeyInvalidError' //	403	%s is invalid.
  | 'ProjectPublicKeyRemovedError' //	403	Project %s is marked as removed.
  | 'ProjectPublicKeyRequiredError' //	403	%s is required.
  | 'RequestFileNumberLimitExceededError' //	400	The request contains too many files.
  | 'RequestFiledsNumberLimitExceededError' //	400	The request contains too many HTTP POST fields.
  | 'RequestSizeLimitExceededError' //	413	The size of the request is too large.
  | 'RequestThrottledError' //	429	Request was throttled.
  | 'SignatureExpirationError' //	403	Expired signature.
  | 'SignatureExpirationInvalidError' //	400	`expire` must be a UNIX timestamp.
  | 'SignatureExpirationRequiredError' //	400	`expire` is required.
  | 'SignatureInvalidError' //	403	Invalid signature.
  | 'SignatureRequiredError' //	400	`signature` is required.
  | 'UploadAPIError' //	500	Internal error.
  | 'UploadFailedError' //	403	Upload failed.
  // FromURL upload errors:
  | 'DownloadFileError' //	500	Failed to download the file.
  | 'DownloadFileHTTPClientError' //	500	HTTP client error: %s.
  | 'DownloadFileHTTPNetworkError' //	500	HTTP network error: %s.
  | 'DownloadFileHTTPServerError' //	500	HTTP server error: %s.
  | 'DownloadFileHTTPURLValidationError' //	500	HTTP URL validation error: %s.
  | 'DownloadFileInternalServerError' //	500	Internal server error.
  | 'DownloadFileNotFoundError' //	500	downloaded file not found.
  | 'DownloadFileSizeLimitExceededError' //	500	Downloaded file is too big: %s > %s.
  | 'DownloadFileTaskFailedError' //	500	download task failed.
  | 'DownloadFileTimeLimitExceededError' //	500	Failed to download the file within the allotted time limit of %s seconds.
  | 'DownloadFileValidationFailedError' //	500	File validation error: %s
  // File upload errors:
  | 'FileIdInvalidError' //	400	file_id is invalid.
  | 'FileIdNotUniqueError' //	400	File id must be unique.
  | 'FileIdRequiredError' //	400	file_id is required.
  | 'FileNotFoundError' //	404	File is not found.
  | 'FileRequiredError' //	400	There should be a file.
  | 'FilesNumberLimitExceededError' //	400	There are too many files.
  | 'FilesRequiredError' //	400	Request does not contain files.
  | 'InternalRequestForbiddenError' //	403	Forbidden request.
  | 'InternalRequestInvalidError' //	400	Incorrect request.
  | 'MultipartFileAlreadyUploadedError' //	400	File is already uploaded.
  | 'MultipartFileCompletionFailedError' //	400	Can not complete upload. Wrong parts size?
  | 'MultipartFileIdRequiredError' //	400	uuid is required.
  | 'MultipartFileNotFoundError' //	404	File is not found.
  | 'MultipartFileSizeLimitExceededError' //	400	File size exceeds project limit.
  | 'MultipartFileSizeTooSmallError' //	400	File size can not be less than %d bytes. Please use direct upload instead of multipart.
  | 'MultipartPartSizeInvalidError' //	400	Multipart Upload Part Size should be an integer.
  | 'MultipartPartSizeTooBigError' //	400	Multipart Upload Part Size can not be more than %d bytes.
  | 'MultipartPartSizeTooSmallError' //	400	Multipart Upload Part Size can not be less than %d bytes.
  | 'MultipartSizeInvalidError' //	400	size should be integer.
  | 'MultipartUploadSizeTooLargeError' //	400	Uploaded size is more than expected.
  | 'MultipartUploadSizeTooSmallError' //	400	File size mismatch. Not all parts uploaded?
  | 'RequestParamRequiredError' //	400	%s is required.
  | 'SourceURLRequiredError' //	400	source_url is required.
  | 'TokenRequiredError' //	400	token is required.
  | 'UUIDInvalidError' //	400	uuid is invalid.
  | 'UploadViewsError' //	400	Upload request processing failed.
  | 'UploadcareFileIdDuplicatedError' //	400	UPLOADCARE_FILE_ID is duplicated. You are probably a lottery winner.
  | 'UploadcareFileIdInvalidError' //	400	UPLOADCARE_FILE_ID should be a valid UUID.
  | 'UploadcareFileIdRequiredError' //	400	UPLOADCARE_FILE_ID is required.
  // File group errors:
  | 'GroupFileURLParsingFailedError' //	400	This is not valid file url: %s.
  | 'GroupFilesInvalidError' //	400	No files[N] parameters found.
  | 'GroupFilesNotFoundError' //	400	Some files not found.
  | 'GroupIdRequiredError' //	400	group_id is required.
  | 'GroupNotFoundError' //	404	group_id is invalid.
  | 'GroupViewsError' //	400	Request to group processing failed.
  // File content validation errors:
  | 'FileInfectedError' //	400	The file is infected by %s virus.
  | 'FileTypeForbiddenError' //	400	Uploading of these file types is not allowed.
  // URL validation errors:
  | 'HostnameNotFoundError' //	400	Host does not exist.
  | 'URLBlacklistedError' //	400	Source is blacklisted.
  | 'URLHostMalformedError' //	400	URL host is malformed.
  | 'URLHostPrivateIPForbiddenError' //	400	Only public IPs are allowed.
  | 'URLHostRequiredError' //	400	No URL host supplied.
  | 'URLParsingFailedError' //	400	Failed to parse URL.
  | 'URLRedirectsLimitExceededError' //	400	Too many redirects.
  | 'URLSchemeInvalidError' //	400	Invalid URL scheme.
  | 'URLSchemeRequiredError' //	400	No URL scheme supplied.
  | 'URLValidationError' //	400	Failed to validate URL.
