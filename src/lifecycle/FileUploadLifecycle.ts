import {FileUploadLifecycleInterface, LifecycleInterface} from './types'
import {Settings, UploadcareFile} from '../types'
import {Uuid} from '..'
import checkFileIsReady from '../checkFileIsReady'
import prettyFileInfo from '../prettyFileInfo'
import {UploadedState} from './UploadedState'
import {PollPromiseInterface} from '../tools/poll'
import {InfoResponse} from '../api/info'

export class FileUploadLifecycle implements FileUploadLifecycleInterface {
  private readonly lifecycle: LifecycleInterface<UploadcareFile>
  protected isFileReadyPolling: PollPromiseInterface<InfoResponse> | null = null

  constructor(lifecycle: LifecycleInterface<UploadcareFile>) {
    this.lifecycle = lifecycle
  }

  handleUploadedFile(uuid: Uuid, settings: Settings): Promise<UploadcareFile> {
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

  getUploadLifecycle(): LifecycleInterface<UploadcareFile> {
    return this.lifecycle
  }
}
