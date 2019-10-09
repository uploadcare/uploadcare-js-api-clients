import {AbstractState} from './AbstractState'
import {LifecycleStateInterface} from '../types'
import {ProgressParamsInterface, ProgressStateEnum, UploadingProgress} from '../../types'

export class UploadingState extends AbstractState implements LifecycleStateInterface {
  readonly progress: UploadingProgress
  protected nextPossibleState: ProgressStateEnum[] = [
    ProgressStateEnum.Uploading,
    ProgressStateEnum.Uploaded,
    ProgressStateEnum.Ready,
    ProgressStateEnum.Canceled,
    ProgressStateEnum.Error,
  ]

  constructor(params: ProgressParamsInterface) {
    super()
    this.progress = {
      state: ProgressStateEnum.Uploading,
      uploaded: params,
      // leave 1 percent for uploaded and 1 for ready on cdn
      value: params ? Math.round((params.loaded / params.total) * 0.98) : 0,
    }
  }
}
