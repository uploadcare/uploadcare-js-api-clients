import {UploadcareGroupInterface} from '../types'
import {GroupUploadLifecycleInterface, UploadInterface} from '../lifecycle/types'

/**
 * Base `thenable` interface for uploading `groupFrom` (`object`, `url`, `input`, `uploaded`).
 */
export interface GroupUploadInterface extends UploadInterface<UploadcareGroupInterface> {}

// export interface GroupHandlerInterface extends UploadHandlerInterface<UploadcareGroupInterface> {}

export interface GroupHandlerInterface {
  upload(groupUploadLifecycle: GroupUploadLifecycleInterface): Promise<UploadcareGroupInterface>;
  cancel(groupUploadLifecycle: GroupUploadLifecycleInterface): void;
}
