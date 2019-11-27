import * as factory from '../test/_fixtureFactory'
import multipartStart from '../src/api/multipart/multipartStart'
import multipartUpload from '../src/api/multipart/multipartUpload'

const fileToUpload = factory.file(12).data

const settings = {
  publicKey: 'pub_test__no_storing',
}

;(async () => {
  try {
    let counter = 0
    const step = 10000
    const intervalID = setInterval(() => {
      counter += step
      console.log('Time after start: ', counter)
    }, step)
    const {parts} = await multipartStart(fileToUpload, settings)
    const upload = multipartUpload(fileToUpload, parts, settings)

    upload.onProgress = (progressEvent) => {
      const progressValue = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      console.log('Progress: ', progressValue)
    }

    await upload
    clearInterval(intervalID)
  } catch (err) {
    console.log(err)
  }
})()
