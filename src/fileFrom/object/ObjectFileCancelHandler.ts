import {CancelableInterface} from '../../api/types'
import {DirectUploadInterface} from '../..'

export class ObjectFileCancelHandler implements CancelableInterface {
  private readonly request: DirectUploadInterface

  constructor(request: DirectUploadInterface) {
    this.request = request
  }
  cancel(): void {
    this.request.cancel()
  }
}
