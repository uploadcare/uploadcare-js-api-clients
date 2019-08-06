import {AbstractState} from './AbstractState'
import {LifecycleStateInterface} from '../types'
import {ProgressStateEnum, UploadingProgress} from '../../types'

export class UploadedState extends AbstractState implements LifecycleStateInterface {
  readonly progress: UploadingProgress = {
    state: ProgressStateEnum.Uploaded,
    uploaded: null,
    value: 99,
  }
  protected nextPossibleState: ProgressStateEnum[] = [
    ProgressStateEnum.Ready,
    ProgressStateEnum.Canceled,
    ProgressStateEnum.Error,
  ]
}
