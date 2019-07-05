import {AbstractState} from './AbstractState'
import {LifecycleStateInterface} from '../types'
import {ProgressState, UploadingProgress} from '../../types'

export class ReadyState extends AbstractState implements LifecycleStateInterface {
  readonly progress: UploadingProgress = {
    state: ProgressState.Ready,
    uploaded: null,
    value: 100,
  }
  protected nextPossibleState: ProgressState[] = [
    ProgressState.Canceled,
    ProgressState.Error,
  ]
}
