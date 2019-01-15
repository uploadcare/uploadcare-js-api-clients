/* @flow */
export type Settings = {
  baseURL?: string,
  publicKey?: string | null,
  doNotStore?: boolean,
  secureSignature?: string,
  secureExpire?: string,
  integration?: string,
}

export type FileData = Blob | File | Buffer

/* TODO Add sourceInfo */
export type FileInfo = {
  uuid: string,
  name: null | string,
  size: null | number,
  isStored: null | boolean,
  isImage: null | boolean,
  cdnUrl: null | string,
  cdnUrlModifiers: null | string,
  originalUrl: null | string,
  originalImageInfo: null | {
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
  },
}
