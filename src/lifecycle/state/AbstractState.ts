import { LifecycleStateInterface } from '../types'
import { ProgressStateEnum, UploadingProgress } from '../../types'

export abstract class AbstractState implements LifecycleStateInterface {
  abstract readonly progress: UploadingProgress
  protected abstract nextPossibleState: ProgressStateEnum[] = []

  isCanBeChangedTo(state: LifecycleStateInterface): boolean {
    return this.nextPossibleState.includes(state.progress.state)
  }
}
