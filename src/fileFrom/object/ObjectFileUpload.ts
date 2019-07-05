import {FileHandlerInterface, FileUploadInterface} from '../types'
import {Thenable} from '../../tools/Thenable'
import {FileData, Settings, UploadcareFileInterface, UploadingProgress} from '../../types'
import {FileUploadLifecycleInterface} from '../../lifecycle/types'
import {CancelableInterface} from '../../api/types'
import {ObjectFileCancelHandler} from './ObjectFileCancelHandler'
import {ObjectFileHandler} from './ObjectFileHandler'
import base from '../../api/base'

export class ObjectFileUpload extends Thenable<UploadcareFileInterface> implements FileUploadInterface {
  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((file: UploadcareFileInterface) => void) | null = null
  onCancel: VoidFunction | null = null

  protected readonly promise: Promise<UploadcareFileInterface>
  private readonly cancelable: CancelableInterface

  constructor(data: FileData, settings: Settings, lifecycle: FileUploadLifecycleInterface) {
    super()
    const request = base(data, settings)
    this.cancelable = new ObjectFileCancelHandler(request)
    const uploadLifecycle = lifecycle.getUploadLifecycle()

    uploadLifecycle.onProgress = this.onProgress
    uploadLifecycle.onUploaded = this.onUploaded
    uploadLifecycle.onReady = this.onReady
    uploadLifecycle.onCancel = this.onCancel

    const handler = new ObjectFileHandler(request, lifecycle, settings)
    this.promise = handler.upload()
  }

  cancel(): void {
    this.cancelable.cancel()
  }
}


// const lifecycle = new UploadLifecycle<UploadcareFileInterface>()
// const fileUploadLifecycle = new FileUploadLifecycle(lifecycle)
//
// const data = {}
// const settings = {}
// const request = base(data as FileData, settings as Settings)
//
// const handler = new ObjectFileHandler(request, fileUploadLifecycle, settings)
// const cancelable = new ObjectFileCancelHandler(request)
//
// const upload = new FileUpload(fileUploadLifecycle, handler, cancelable)
