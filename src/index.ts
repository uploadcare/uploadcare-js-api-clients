import UploadClient from "./UploadClient";

import request from "./api/request/request";
import base from "./api/base";
import fromUrl from "./api/fromUrl";
import fromUrlStatus from "./api/fromUrlStatus";
import group from "./api/group";
import groupInfo from "./api/groupInfo";
import info from "./api/info";

import multipartStart from "./api/multipart/multipartStart";
import multipartUpload from "./api/multipart/multipartUpload";
import multipartComplete from "./api/multipart/multipartComplete";

import multipart from "./multipart/multipart";

import fileFrom from "./fileFrom/fileFrom";
import groupFrom from "./groupFrom/groupFrom";

/* Types */
export {
  SettingsInterface,
  FileData,
  OriginalImageInfoInterface,
  UploadcareFileInterface,
  UploadClientInterface
} from "./types";
export { Url } from "./api/fromUrl";
export { Uuid, UploadAPIInterface } from "./api/types";
export { RequestOptionsInterface, RequestInterface } from "./api/request/types";

/* Low-Level API */
export { request };

/* Middle-Level API */
export {
  base,
  fromUrl,
  fromUrlStatus,
  group,
  groupInfo,
  info,
  multipartStart,
  multipartUpload,
  multipartComplete
};

/* High-Level API */
export { multipart, fileFrom, groupFrom };

export default UploadClient;
