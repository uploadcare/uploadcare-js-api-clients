import {AbstractState} from './AbstractState'
import {LifecycleStateInterface} from './types'
import {ProgressState, UploadingProgress} from '../types'

export class PendingState extends AbstractState implements LifecycleStateInterface {
  readonly progress: UploadingProgress = {
    state: ProgressState.Pending,
    uploaded: null,
    value: 0,
  }
  protected next: ProgressState[] = [
    ProgressState.Uploading,
    ProgressState.Uploaded,
    ProgressState.Ready,
    ProgressState.Canceled,
    ProgressState.Error,
  ]
}
