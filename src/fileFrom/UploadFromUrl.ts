// import fromUrl, {FromUrlResponse, isFileInfoResponse, isTokenResponse, Url} from '../api/fromUrl'
// import {SettingsInterface, UploadcareFileInterface, ProgressStateEnum} from '../types'
// import fromUrlStatus, {
//   FromUrlStatusResponse,
//   isErrorResponse,
//   isProgressResponse,
//   isSuccessResponse,
//   isUnknownResponse,
//   isWaitingResponse,
// } from '../api/fromUrlStatus'
// import {UploadFrom} from './UploadFrom'
// import checkFileIsUploadedFromUrl from '../checkFileIsUploadedFromUrl'
// import {PollPromiseInterface} from '../tools/poll'
// import CancelError from '../errors/CancelError'
// import {Uuid} from '../api/types'
// import defaultSettings from '../defaultSettings'
//
// export class UploadFromUrl extends UploadFrom {
//   protected readonly promise: Promise<UploadcareFileInterface>
//
//   private isFileUploadedFromUrlPolling: PollPromiseInterface<FromUrlStatusResponse> | null = null
//   private isCancelled = false
//   private unknownStatusWasTimes = 0
//   private readonly data: Url
//   private readonly settings: SettingsInterface
//
//   constructor(data: Url, settings: SettingsInterface) {
//     super()
//
//     this.data = data
//     this.settings = settings
//
//     this.promise = this.getFilePromise()
//   }
//
//   private getFilePromise = (): Promise<UploadcareFileInterface> => {
//     this.handleUploading()
//
//     return fromUrl(this.data, this.settings)
//       .then(this.handleFromUrlResponse)
//       .then(this.handleReady)
//       .catch(this.handleError)
//   }
//
//   private handleFromUrlResponse = (response: FromUrlResponse): Promise<UploadcareFileInterface> => {
//     if (isTokenResponse(response)) {
//       const {token} = response
//
//       return fromUrlStatus(token, this.settings)
//         .then(response => this.handleFromUrlStatusResponse(token, response))
//         .catch(this.handleError)
//     } else if (isFileInfoResponse(response)) {
//       const {uuid} = response
//
//       return this.handleUploaded(uuid, this.settings)
//     } else {
//       throw new Error(`Response type "${response}" is unknown`)
//     }
//   }
//
//   private handleFromUrlStatusResponse = (token: Uuid, response: FromUrlStatusResponse): Promise<UploadcareFileInterface> => {
//     this.isFileUploadedFromUrlPolling = checkFileIsUploadedFromUrl({
//       token,
//       timeout: this.settings.pollingTimeoutMilliseconds || defaultSettings.pollingTimeoutMilliseconds,
//       onProgress: (response) => {
//         // Update uploading progress
//         this.handleUploading({
//           total: response.total,
//           loaded: response.done,
//         })
//       },
//       settings: this.settings
//     })
//
//     if (isUnknownResponse(response)) {
//       this.unknownStatusWasTimes++
//
//       if (this.unknownStatusWasTimes === 3) {
//         return Promise.reject(`Token "${token}" was not found.`)
//       } else {
//         return this.isFileUploadedFromUrlPolling
//           .then(status => this.handleFromUrlStatusResponse(token, status))
//           .catch(this.handleError)
//       }
//     }
//
//     if (isWaitingResponse(response)) {
//       return this.isFileUploadedFromUrlPolling
//         .then(status => this.handleFromUrlStatusResponse(token, status))
//         .catch(this.handleError)
//     }
//
//     if (isErrorResponse(response)) {
//       return this.handleError(response.error)
//     }
//
//     if (isProgressResponse(response)) {
//       if (this.isCancelled) {
//         return Promise.reject(new CancelError())
//       }
//
//       this.handleUploading({
//         total: response.total,
//         loaded: response.done,
//       })
//
//       return this.isFileUploadedFromUrlPolling
//         .then(status => this.handleFromUrlStatusResponse(token, status))
//         .catch(this.handleError)
//     }
//
//     if (isSuccessResponse(response)) {
//       const {uuid} = response
//
//       if (this.isCancelled) {
//         return Promise.reject(new CancelError())
//       }
//
//       return this.handleUploaded(uuid, this.settings)
//         .then(this.handleReady)
//         .catch(this.handleError)
//     }
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
