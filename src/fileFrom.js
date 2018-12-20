/* @flow */
import type {FileData, FileInfo, Settings} from './types'

export type File = {|
  status: 'uploading' | 'uploaded' | 'ready',
  info: FileInfo,
  promise: Promise<FileInfo>,
  onProgress: Function | null,
  onCancel: Function | null,
  cancel: Function,
|}

/* TODO Need to handle errors */
/**
 * Upload file to Uploadcare. Resolves when file is ready on CDN.
 *
 * @param {string} from
 * @param {FileData} data
 * @param {Settings} settings
 * @return {File}
 */
export default function fileFrom(from: string, data: FileData, settings: Settings = {}): File {
  const uploading = this.api.base(data, settings)
  const file = {
    status: 'uploading',
    info: {},
    promise: new Promise((resolve, reject) => {
      uploading.promise
        .then(({file: uuid}) => {
          file.status = 'uploaded'
          file.info = {uuid}

          let timeout = 100

          const updateFileInfo = () => new Promise((resolveUpdating, rejectUpdating) => {
            this.api.info(uuid, settings)
              .then(fileInfo => {
                file.info = {...fileInfo}

                if (file.info.is_ready) {
                  resolveUpdating()
                }
                else {
                  setTimeout(() => {
                    updateFileInfo()
                      .then(() => resolveUpdating())
                      .catch(() => rejectUpdating())
                  }, timeout)

                  timeout += 50
                }
              })
              .catch(() => rejectUpdating())
          })

          updateFileInfo()
            .then(() => {
              file.status = 'ready'

              resolve(file.info)
            })
            .catch(() => {
              reject()
            })
        })
        .catch(error => {
          reject(error)
        })
    }),
    onProgress: null,
    onCancel: null,
    cancel: uploading.cancel,
  }

  return file
}
