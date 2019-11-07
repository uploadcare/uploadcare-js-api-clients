// import poll from '../../src/tools/poll'
// import info from '../../src/api/info'
// import {getSettingsForTesting} from '../_helpers'
// import * as factory from '../_fixtureFactory'
// import CancelError from '../../src/errors/CancelError'
// import {FileInfoInterface} from '../../src/api/types'
//
// describe('poll', () => {
//   const uuid = factory.uuid('image')
//   const settings = getSettingsForTesting({
//     publicKey: factory.publicKey('image'),
//   })
//   const onProgress = (response) => {
//     return response
//   }
//
//   it('should be resolved', async() => {
//     const polling = poll<FileInfoInterface>({
//       task: info(uuid, settings),
//       condition: (response) => {
//         if (response.is_ready) {
//           return response
//         }
//
//         if (typeof onProgress === 'function') {
//           onProgress(response)
//         }
//
//         return false
//       },
//       taskName: 'checkFileIsReady',
//     })
//     const result = await polling.promise
//
//     expect(result.is_ready).toBeTruthy()
//   })
//
//   it('should be able to cancel polling', (done) => {
//     const polling = poll<FileInfoInterface>({
//       task: info(uuid, settings),
//       condition: (response) => {
//         if (response.is_ready) {
//           return response
//         }
//
//         if (typeof onProgress === 'function') {
//           onProgress(response)
//         }
//
//         return false
//       },
//       taskName: 'checkFileIsReady',
//     })
//
//     polling
//       .promise
//       .catch((error) => {
//         if (error.name === 'CancelError') {
//           done()
//         } else {
//           done.fail(error)
//         }
//       })
//
//     setTimeout(() => {
//       polling.cancel()
//     }, 1)
//   })
// })
