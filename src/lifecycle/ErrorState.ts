import {AbstractState} from './AbstractState'
import {LifecycleStateInterface} from './types'
import {ProgressState, UploadingProgress} from '../types'

export class ErrorState extends AbstractState implements LifecycleStateInterface {
  readonly progress: UploadingProgress = {
    state: ProgressState.Error,
    uploaded: null,
    value: 0,
  }
  protected next: ProgressState[] = [

  ]
}
