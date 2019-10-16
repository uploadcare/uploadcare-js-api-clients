export interface UploadHandlerInterface<T, U> {
  upload(entityUploadLifecycle: U): Promise<T>;
  cancel(entityUploadLifecycle: U): void;
}

import {FileUploadLifecycleInterface} from '../lifecycle/types'
import {UploadcareFileInterface} from '../types'

export interface FileHandlerInterface {
  upload(fileUploadLifecycle: FileUploadLifecycleInterface): Promise<UploadcareFileInterface>;
  cancel(fileUploadLifecycle: FileUploadLifecycleInterface): void;
}
