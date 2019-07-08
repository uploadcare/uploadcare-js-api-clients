import {FileFrom, GroupHandlerInterface} from '../fileFrom/types'
import {FileData, Settings, UploadcareFileInterface, UploadcareGroupInterface} from '../types'
import fileFrom from '../fileFrom/fileFrom'
import group from '../api/group'
import {UploadcareGroup} from '../UploadcareGroup'
import {Url} from '..'

export class UrlFilesGroupUploadHandler implements GroupHandlerInterface {
  private readonly data: Url[]
  private readonly settings: Settings
  private readonly files: Promise<UploadcareFileInterface>[]

  constructor(from, data: Url[], settings: Settings = {}) {
    this.data = data
    this.settings = settings

    this.files = data.map(item => fileFrom(FileFrom.URL, item, settings))
  }

  upload(): Promise<UploadcareGroupInterface> {
    return Promise.all(this.files)
      .then(files => {
        const uuids = files.map(file => file.uuid)

        return group(uuids, this.settings)
          .then(info => {
            return Promise.resolve(new UploadcareGroup(info))
          })
      })
  }
}
