import {FileUploadLifecycleInterface, LifecycleInterface} from './types'
import {SettingsInterface, UploadcareFileInterface} from '../types'
import {Uuid} from '..'
import checkFileIsReady from '../checkFileIsReady'
import prettyFileInfo from '../prettyFileInfo'
import {UploadedState} from './state/UploadedState'
import {PollPromiseInterface} from '../tools/poll'
import {FileInfoInterface} from '../api/types'

export class FileUploadLifecycle implements FileUploadLifecycleInterface {
  private readonly lifecycle: LifecycleInterface<UploadcareFileInterface>
  private isFileReadyPolling: PollPromiseInterface<FileInfoInterface> | null = null

  constructor(lifecycle: LifecycleInterface<UploadcareFileInterface>) {
    this.lifecycle = lifecycle
  }

  handleUploadedFile(uuid: Uuid, settings: SettingsInterface): Promise<UploadcareFileInterface> {
    this.lifecycle.updateEntity({
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
    })

    this.lifecycle.updateState(new UploadedState())

    if (typeof this.lifecycle.onUploaded === 'function') {
      this.lifecycle.onUploaded(uuid)
    }

    this.isFileReadyPolling = checkFileIsReady({
      uuid,
      settings,
    })

    return this.isFileReadyPolling
      .then(info => {
        this.lifecycle.updateEntity(prettyFileInfo(info, settings))

        return Promise.resolve(this.lifecycle.getEntity())
      })
      .catch(error => Promise.reject(error))
  }

  getUploadLifecycle(): LifecycleInterface<UploadcareFileInterface> {
    return this.lifecycle
  }
}
