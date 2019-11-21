import checkFileIsReady from '../src/checkFileIsReady'
import * as factory from '../test/_fixtureFactory'
import base from '../src/api/base'

// ;(async () => {
//   try {
//     const fileToUpload = factory.uuid('image')
//     const settings = {
//       publicKey: factory.publicKey('image')
//     }
//     const {uuid} = await info(fileToUpload, settings)
//     const polling = checkFileIsReady({
//       uuid,
//       settings,
//       timeout: 10,
//     })
//
//     const result = await polling.promise
//     console.log(result)
//   } catch (error) {
//     console.log(error)
//   }
// })()

;(async () => {
  try {
    const fileToUpload = factory.image('blackSquare')
    const settings = {
      publicKey: factory.publicKey('demo')
    }
    const {file: uuid} = await base(fileToUpload.data, settings)
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
