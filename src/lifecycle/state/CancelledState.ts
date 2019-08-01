import {AbstractState} from './AbstractState'
import {LifecycleStateInterface} from '../types'
import {ProgressStateEnum, UploadingProgress} from '../../types'

export class CancelledState extends AbstractState implements LifecycleStateInterface {
  readonly progress: UploadingProgress = {
    state: ProgressStateEnum.Canceled,
    uploaded: null,
    value: 0,
  }
  protected nextPossibleState: ProgressStateEnum[] = []
}
