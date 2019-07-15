import {AbstractState} from './AbstractState'
import {LifecycleStateInterface} from '../types'
import {ProgressState, UploadingProgress} from '../../types'

export class CancelledState extends AbstractState implements LifecycleStateInterface {
  readonly progress: UploadingProgress = {
    state: ProgressState.Canceled,
    uploaded: null,
    value: 0,
  }
  protected nextPossibleState: ProgressState[] = []
}
