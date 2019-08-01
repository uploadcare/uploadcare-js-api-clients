import {AbstractState} from './AbstractState'
import {LifecycleStateInterface} from '../types'
import {ProgressStateEnum, UploadingProgress} from '../../types'

export class ReadyState extends AbstractState implements LifecycleStateInterface {
  readonly progress: UploadingProgress = {
    state: ProgressStateEnum.Ready,
    uploaded: null,
    value: 100,
  }
  protected nextPossibleState: ProgressStateEnum[] = [
    ProgressStateEnum.Canceled,
    ProgressStateEnum.Error,
  ]
}
