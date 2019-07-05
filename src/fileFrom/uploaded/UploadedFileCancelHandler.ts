import {CancelableInterface} from '../../api/types'
import {ProgressState} from '../../types'

export class UploadedFileCancelHandler implements CancelableInterface {


  cancel(): void {
    const {state} = this.uploadLifecycle.getProgress()

    switch (state) {
      case ProgressState.Uploading:
        this.isCancelled = true
        break
      case ProgressState.Uploaded:
      case ProgressState.Ready:
        if (this.isFileReadyPolling) {
          this.isFileReadyPolling.cancel()
        } else {
          this.isCancelled = true
        }
        break
    }
  }
}
