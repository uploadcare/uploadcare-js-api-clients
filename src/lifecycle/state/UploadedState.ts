import {AbstractState} from './AbstractState'
import {LifecycleStateInterface} from '../types'
import {ProgressState, UploadingProgress} from '../../types'

export class UploadedState extends AbstractState implements LifecycleStateInterface {
  readonly progress: UploadingProgress = {
    state: ProgressState.Uploaded,
    uploaded: null,
    value: 99,
  }
  protected nextPossibleState: ProgressState[] = [
    ProgressState.Ready,
    ProgressState.Canceled,
    ProgressState.Error,
  ]
}
