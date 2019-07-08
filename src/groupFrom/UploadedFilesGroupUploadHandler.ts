import {GroupHandlerInterface} from '../fileFrom/types'
import {Settings, UploadcareGroupInterface} from '../types'
import group from '../api/group'
import {UploadcareGroup} from '../UploadcareGroup'
import {Uuid} from '..'

export class UploadedFilesGroupUploadHandler implements GroupHandlerInterface {
  private readonly data: Uuid[]
  private readonly settings: Settings

  constructor(from, data: Uuid[], settings: Settings = {}) {
    this.data = data
    this.settings = settings
  }

  upload(): Promise<UploadcareGroupInterface> {
    return group(this.data, this.settings)
      .then(info => {
        return Promise.resolve(new UploadcareGroup(info))
      })
  }
}
