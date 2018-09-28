/* @flow */

export type ProgressListener = ({total: number, loaded: number}) => void

export interface Request<T> {
  promise: Promise<T>;
  cancel(): void;
  progress(callback: ProgressListener): Request<T>;
}

export type Headers = {
  [name: string]: string,
}

export type FileData = Blob | File | Buffer

export type UCResponse<T> = {
  code: number,
  data: T | ErrorResponse,
}

export type UCRequest<T> = Request<UCResponse<T>>
export type UCSimpleRequest<T> = $PropertyType<UCRequest<T>, 'promise'>

export type ErrorResponse = {
  error: {
    status_code: number,
    content: string,
  };
}

export type FileInfo = {
  is_stored: boolean,
  done: number,
  file_id: string,
  total: number,
  size: number,
  uuid: string,
  is_image: boolean,
  filename: string,
  is_ready: boolean,
  original_filename: string,
  mime_type: string,
  image_info?: {
    orientation: any,
    format: string,
    height: number,
    width: number,
    geo_location: any,
    datetime_original: any,
  },
}

export type GroupInfo = {
  id: string,
  datetime_created: string,
  datetime_stored: any,
  files_count: number,
  cdn_url: string,
  url: string,
  files: Array<FileInfo>,
}
