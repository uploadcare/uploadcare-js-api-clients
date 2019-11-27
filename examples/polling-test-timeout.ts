import checkFileIsReady from '../src/checkFileIsReady'
import * as factory from '../test/_fixtureFactory'
import base from '../src/api/base'
import poll from '../src/tools/poll'
import {FileInfoInterface} from '../src/api/types'
import info from '../src/api/info'

;(async () => {
  try {
    const fileToUpload = factory.file(0.2)
    const settings = {
      publicKey: factory.publicKey('demo'),
      doNotStore: true
    }
    const upload = base(fileToUpload.data, settings)

    upload.onProgress = (progress => console.log(progress))

    const {file: uuid} = await upload
    console.log(uuid)

    const task = info(uuid, settings)

    task.onCancel = () => console.log('Task cancelled')

    const polling = poll<FileInfoInterface>({
      task,
      condition: (response) => {
        if (response.is_ready) {
          return response
        }

        return false
      },
      taskName: 'checkFileIsReady',
      onCancel: () => console.log('Polling cancelled'),
      timeout: 100
    })

    const result = await polling.promise
    console.log(result)
  } catch (error) {
    console.log(error)
  }
})()
