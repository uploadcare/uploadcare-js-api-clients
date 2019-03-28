export type Settings = {
  baseCDN?: string,
  baseURL?: string,
  publicKey?: string | null,
  fileName?: string,
  doNotStore?: boolean,
  secureSignature?: string,
  secureExpire?: string,
  integration?: string,
}

export type FileData = Blob | File | Buffer

export type OriginalImageInfo = {
  width: number,
  height: number,
  format: string,
  datetimeOriginal: null | string,
  geoLocation: null | {
    latitude: number,
    longitude: number,
  },
  orientation: null | number,
  dpi: null | Array<number>,
  colorMode: string,
  sequence?: boolean,
}

/* TODO Add sourceInfo */
export type UploadcareFile = {
  uuid: string,
  name: null | string,
  size: null | number,
  isStored: null | boolean,
  isImage: null | boolean,
  cdnUrl: null | string,
  cdnUrlModifiers: null | string,
  originalUrl: null | string,
  originalFilename: null | string,
  originalImageInfo: null | OriginalImageInfo,
}
