export interface HandlerInterface<T> {
  upload(): Promise<T>;
}

import {FileUploadLifecycleInterface} from '../lifecycle/types'
import {UploadcareFileInterface} from '../types'

export interface FileHandlerInterface {
  upload(lifecycle: FileUploadLifecycleInterface): Promise<UploadcareFileInterface>;
  cancel(lifecycle: FileUploadLifecycleInterface): void;
}
