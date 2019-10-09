// import {FileHandlerInterface} from './types'
// import {ProgressStateEnum, SettingsInterface, UploadcareFileInterface} from '../types'
// import {FileUploadLifecycleInterface} from '../lifecycle/types'
// import {PollPromiseInterface} from '../tools/poll'
// import {FromUrlStatusResponse} from '../api/fromUrlStatus'
// import {Url} from '..'
//
// export class FromUrlFileHandler implements FileHandlerInterface {
//   private isFileUploadedFromUrlPolling: PollPromiseInterface<FromUrlStatusResponse> | null = null
//   private isCancelled = false
//   private unknownStatusWasTimes = 0
//   private readonly data: Url
//   private readonly settings: SettingsInterface
//
//   constructor(data: Url, settings: SettingsInterface) {
//     this.data = data
//     this.settings = settings
//   }
//
//   upload(lifecycle: FileUploadLifecycleInterface): Promise<UploadcareFileInterface> {
//     return undefined
//   }
//
//   cancel(): void {
//     const {state} = this.getProgress()
//
//     switch (state) {
//       case ProgressStateEnum.Uploading:
//         if (this.isFileUploadedFromUrlPolling) {
//           this.isFileUploadedFromUrlPolling.cancel()
//         } else {
//           this.isCancelled = true
//         }
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
