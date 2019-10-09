// import {UploadFrom} from './UploadFrom'
// import info from '../api/info'
// import CancelError from '../errors/CancelError'
//
// /* Types */
// import {SettingsInterface, ProgressStateEnum, UploadcareFileInterface} from '../types'
// import {FileInfoInterface, Uuid} from '../api/types'
//
// export class UploadFromUploaded extends UploadFrom {
//   protected readonly promise: Promise<UploadcareFileInterface>
//
//   private isCancelled = false
//   private readonly data: Uuid
//   private readonly settings: SettingsInterface
//
//   constructor(data: Uuid, settings: SettingsInterface) {
//     super()
//
//     this.data = data
//     this.settings = {
//       ...settings,
//       source: 'uploaded',
//     }
//
//     this.promise = this.getFilePromise()
//   }
//
//   private getFilePromise = (): Promise<UploadcareFileInterface> => {
//     this.handleUploading()
//
//     return info(this.data, this.settings)
//       .then(this.handleInfoResponse)
//       .then(this.handleReady)
//       .catch(this.handleError)
//   }
//
//   private handleInfoResponse = (response: FileInfoInterface): Promise<UploadcareFileInterface> => {
//     if (this.isCancelled) {
//       return Promise.reject(new CancelError())
//     }
//
//     const {uuid} = response
//
//     return this.handleUploaded(uuid, this.settings)
//   }
//
//   /**
//    * Cancel uploading.
//    */
//   cancel(): void {
//     const {state} = this.getProgress()
//
//     switch (state) {
//       case ProgressStateEnum.Uploading:
//         this.isCancelled = true
//         break
//       case ProgressStateEnum.Uploaded:
//       case ProgressStateEnum.Ready:
//         if (this.isFileReadyPolling) {
//           this.isFileReadyPolling.cancel()
//         } else {
//           this.isCancelled = true
//         }
//         break
//     }
//   }
// }
