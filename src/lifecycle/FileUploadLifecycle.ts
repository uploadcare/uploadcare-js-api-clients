import {FileUploadLifecycleInterface, LifecycleInterface} from './types'
import {SettingsInterface, UploadcareFileInterface} from '../types'
import {Uuid} from '..'
import checkFileIsReady from '../checkFileIsReady'
import prettyFileInfo from '../prettyFileInfo'
import {UploadedState} from './state/UploadedState'
import {PollPromiseInterface} from '../tools/poll'
import {FileInfoInterface} from '../api/types'

export class FileUploadLifecycle implements FileUploadLifecycleInterface {
  readonly uploadLifecycle: LifecycleInterface<UploadcareFileInterface>
  private isFileReadyPolling: PollPromiseInterface<FileInfoInterface> | null = null

  constructor(lifecycle: LifecycleInterface<UploadcareFileInterface>) {
    this.uploadLifecycle = lifecycle
  }

  handleUploadedFile(uuid: Uuid, settings: SettingsInterface): Promise<UploadcareFileInterface> {
    const file = {
      uuid,
      name: null,
      size: null,
      isStored: null,
      isImage: null,
      cdnUrl: null,
      cdnUrlModifiers: null,
      originalUrl: null,
      originalFilename: null,
      originalImageInfo: null,
    }
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
        const file = prettyFileInfo(info, settings)
        uploadLifecycle.updateEntity(file)

        return Promise.resolve(uploadLifecycle.getEntity())
      })
      .catch(uploadLifecycle.handleError)
  }

  getIsFileReadyPolling = (): PollPromiseInterface<FileInfoInterface> | null => {
    return this.isFileReadyPolling
  }
}
