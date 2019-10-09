// import {FileHandlerInterface} from './types'
// import {ProgressStateEnum, SettingsInterface, UploadcareFileInterface} from '../types'
// import {Uuid} from '..'
// import {FileUploadLifecycleInterface} from '../lifecycle/types'
// import {BaseThenableInterface, CancelableThenableInterface} from '../thenable/types'
// import {FileInfoInterface} from '../api/types'
// import info from '../api/info'
//
// export class FromUploadedFileHandler implements FileHandlerInterface {
//   private isCancelled = false
//   private readonly data: Uuid
//   private readonly settings: SettingsInterface
//
//   constructor(data: Uuid, settings: SettingsInterface) {
//     this.data = data
//     this.settings = {
//       ...settings,
//       source: 'uploaded',
//     }
//   }
//
//   async upload(lifecycle: FileUploadLifecycleInterface): Promise<UploadcareFileInterface> {
//     const uploadLifecycle = lifecycle.getUploadLifecycle()
//
//     uploadLifecycle.handleUploading()
//
//     const {uuid} = await info(this.data, this.settings)
//
//     return lifecycle.handleUploadedFile(uuid, this.settings)
//   }
//
//   cancel(lifecycle: FileUploadLifecycleInterface): void {
//     const uploadLifecycle = lifecycle.getUploadLifecycle()
//     const {state} = uploadLifecycle.getProgress()
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
