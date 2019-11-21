import info from '../src/api/info'
import checkFileIsReady from '../src/checkFileIsReady'
import * as factory from '../test/_fixtureFactory'

;(async () => {
  try {
    const fileToUpload = factory.uuid('image')
    const settings = {
      publicKey: factory.publicKey('image')
    }
    const {uuid} = await info(fileToUpload, settings)
    const polling = checkFileIsReady({
      uuid,
      settings,
    })

    polling.cancel()

    const result = await polling.promise
    console.log(result)
  } catch (error) {
    console.log(error)
  }
})()
