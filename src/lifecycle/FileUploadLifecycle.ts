import checkFileIsReady from '../checkFileIsReady'
import {UploadedState} from './state/UploadedState'
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

    this.uploadLifecycle.updateEntity(file)
    this.uploadLifecycle.updateState(new UploadedState())

    if (typeof this.uploadLifecycle.onUploaded === 'function') {
      this.uploadLifecycle.onUploaded(uuid)
    }

    this.isFileReadyPolling = checkFileIsReady({
      uuid,
      settings,
    })

    const uploadLifecycle = this.uploadLifecycle

    return this.isFileReadyPolling
      .then(info => {
        const file = UploadcareFile.fromFileInfo(info, settings)
        uploadLifecycle.updateEntity(file)

        return Promise.resolve(file)
      })
      .catch(uploadLifecycle.handleError.bind(uploadLifecycle))
  }

  getIsFileReadyPolling = (): PollPromiseInterface<FileInfoInterface> | null => {
    return this.isFileReadyPolling
  }
}
