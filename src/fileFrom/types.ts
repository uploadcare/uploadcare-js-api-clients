export interface HandlerInterface<T> {
  upload(): Promise<T>;
}

import {FileUploadLifecycleInterface} from '../lifecycle/types'
import {UploadcareFileInterface} from '../types'

export interface FileHandlerInterface {
  upload(fileUploadLifecycle: FileUploadLifecycleInterface): Promise<UploadcareFileInterface>;
  cancel(fileUploadLifecycle: FileUploadLifecycleInterface): void;
}
