import {AbstractState} from './AbstractState'
import {LifecycleStateInterface} from './types'
import {ProgressParams, ProgressState, UploadingProgress} from '../types'

export class UploadingState extends AbstractState implements LifecycleStateInterface {
  readonly progress: UploadingProgress
  protected next: ProgressState[] = [
    ProgressState.Uploaded,
    ProgressState.Ready,
    ProgressState.Canceled,
    ProgressState.Error,
  ]

  constructor(params: ProgressParams) {
    super()
    this.progress = {
      state: ProgressState.Uploading,
      uploaded: params,
      // leave 1 percent for uploaded and 1 for ready on cdn
      value: params ? Math.round((params.loaded * 98) / params.total) : 0,
    }
  }
}
