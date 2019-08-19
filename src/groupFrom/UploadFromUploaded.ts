import {SettingsInterface, UploadcareGroupInterface} from '../types'
import {UploadFrom} from './UploadFrom'
import {Uuid} from '..'
import CancelError from '../errors/CancelError'
import group from '../api/group'
import {GroupInfoInterface} from '../api/types'

export class UploadFromUploaded extends UploadFrom {
  protected readonly promise: Promise<UploadcareGroupInterface>

  private readonly data: Uuid[]
  private readonly settings: SettingsInterface

  constructor(data: Uuid[], settings: SettingsInterface) {
    super()

    this.data = data
    this.settings = {
      ...settings,
      source: 'uploaded',
    }

    this.promise = this.getGroupPromise()
  }

  private getGroupPromise = (): Promise<UploadcareGroupInterface> => {
    this.handleUploading()

    return group(this.data, this.settings)
      .then(this.handleInfoResponse)
      .then(this.handleReady)
      .catch(this.handleError)
  }

  private handleInfoResponse = (groupInfo: GroupInfoInterface) => {
    if (this.isCancelled) {
      return Promise.reject(new CancelError())
    }

    return this.handleUploaded(groupInfo)
  }

  cancel(): void {
    this.isCancelled = true
  }
}
