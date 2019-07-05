import {LifecycleStateInterface} from '../types'
import {ProgressState, UploadingProgress} from '../../types'

export abstract class AbstractState implements LifecycleStateInterface {
  abstract readonly progress: UploadingProgress
  protected abstract nextPossibleState: ProgressState[] = []

  isCanBeChangedTo(state: LifecycleStateInterface): boolean {
    return this.nextPossibleState.includes(state.progress.state)
  }
}
