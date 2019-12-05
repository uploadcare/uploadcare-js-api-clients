import checkFileIsReady from '../checkFileIsReady'
import {UploadcareFile} from '../UploadcareFile'

/* Types */
import {FileUploadLifecycleInterface, LifecycleInterface} from './types'
import {SettingsInterface, UploadcareFileInterface} from '../types'
import {Uuid} from '..'
import {PollPromiseInterface} from '../tools/poll'
import {FileInfoInterface} from '../api/types'

export class FileUploadLifecycle implements FileUploadLifecycleInterface {
  readonly uploadLifecycle: LifecycleInterface<UploadcareFileInterface>
  private isFileReadyPolling: PollPromiseInterface<FileInfoInterface> | null = null

  constructor(lifecycle: LifecycleInterface<UploadcareFileInterface>) {
    this.uploadLifecycle = lifecycle
  }

  handleUploadedFile(uuid: Uuid, settings: SettingsInterface): Promise<UploadcareFileInterface> {
    const file = UploadcareFile.fromUuid(uuid)
    const uploadLifecycle = this.uploadLifecycle

    uploadLifecycle.updateEntity(file)
    uploadLifecycle.handleUploaded(uuid)

    this.isFileReadyPolling = checkFileIsReady({
      uuid,
      settings,
    })

    return this.isFileReadyPolling
      .then(info => {
        const file = UploadcareFile.fromFileInfo(info, settings)

        uploadLifecycle.updateEntity(file)
      })
      .then(uploadLifecycle.handleReady.bind(uploadLifecycle))
      .catch(uploadLifecycle.handleError.bind(uploadLifecycle))
  }

  getIsFileReadyPolling = (): PollPromiseInterface<FileInfoInterface> | null => {
    return this.isFileReadyPolling
  }
}
