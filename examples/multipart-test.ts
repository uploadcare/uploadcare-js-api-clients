import * as factory from '../test/_fixtureFactory'
import multipartStart from '../src/api/multipart/multipartStart'
import multipartUpload from '../src/api/multipart/multipartUpload'

const fileToUpload = factory.file(12).data

const settings = {
  publicKey: 'pub_test__no_storing',
}

;(async () => {
  try {
    const {parts} = await multipartStart(fileToUpload, settings)
    const upload = multipartUpload(fileToUpload, parts, settings)

    upload.onProgress = (progressEvent) => {
      const progressValue = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      console.log(progressValue)
    }

    await upload
  } catch (err) {
    console.log(err)
  }
})()
