import {AbstractState} from './AbstractState'
import {LifecycleStateInterface} from '../types'
import {ProgressStateEnum, UploadingProgress} from '../../types'

export class ErrorState extends AbstractState implements LifecycleStateInterface {
  readonly progress: UploadingProgress = {
    state: ProgressStateEnum.Error,
    uploaded: null,
    value: 0,
  }
  protected nextPossibleState: ProgressStateEnum[] = []
}
