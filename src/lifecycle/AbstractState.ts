import {LifecycleStateInterface} from './types'
import {ProgressState, UploadingProgress} from '../types'

export abstract class AbstractState implements LifecycleStateInterface {
  abstract readonly progress: UploadingProgress
  protected abstract next: ProgressState[] = []

  isCanBeChangedTo(state: LifecycleStateInterface): boolean {
    return this.next.includes(state.progress.state)
  }
}
