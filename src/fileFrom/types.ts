export enum FileFromEnum {
  Object = 'object',
  URL = 'url',
  DOM = 'input',
  Uploaded = 'uploaded',
}

export interface HandlerInterface<T> {
  upload(): Promise<T>;
}
