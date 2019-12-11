import { AbstractState } from "./AbstractState"
import { LifecycleStateInterface } from "../types"
import { ProgressStateEnum, UploadingProgress } from "../../types"

export class PendingState extends AbstractState
  implements LifecycleStateInterface {
  readonly progress: UploadingProgress = {
    state: ProgressStateEnum.Pending,
    uploaded: null,
    value: 0
  }
  protected nextPossibleState: ProgressStateEnum[] = [
    ProgressStateEnum.Uploading,
    ProgressStateEnum.Uploaded,
    ProgressStateEnum.Ready,
    ProgressStateEnum.Cancelled,
    ProgressStateEnum.Error
  ]
}
