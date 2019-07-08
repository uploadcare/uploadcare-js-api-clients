import {FileFrom, GroupHandlerInterface} from '../fileFrom/types'
import {FileData, Settings, UploadcareFileInterface, UploadcareGroupInterface} from '../types'
import fileFrom from '../fileFrom/fileFrom'
import group from '../api/group'
import {UploadcareGroup} from '../UploadcareGroup'

export class ObjectFilesGroupUploadHandler implements GroupHandlerInterface {
  private readonly data: FileData[]
  private readonly settings: Settings
  private readonly files: Promise<UploadcareFileInterface>[]

  constructor(from, data: FileData[], settings: Settings = {}) {
    this.data = data
    this.settings = settings

    this.files = data.map(item => fileFrom(FileFrom.Object, item, settings))
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
