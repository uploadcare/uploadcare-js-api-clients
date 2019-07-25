import {CancelableInterface} from '../api/types'
import {HandleProgressFunction} from '../api/request/types'

export interface UploadThenableInterface<T> extends Promise<T>, CancelableInterface {
  onProgress: HandleProgressFunction | null
  onCancel: VoidFunction | null
}
