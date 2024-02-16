import { shrinkImage } from './shrinkImage'
import { stripIccProfile } from './IccProfile/stripIccProfile'
import { shouldSkipShrink } from './shouldSkipShrink'
import { canvasToBlob } from './canvas/canvasToBlob'
import { hasTransparency } from './canvas/hasTransparency'
import { isBrowserApplyExif } from './exif/isBrowserApplyExif'
import { getExif } from './exif/getExif'
import { getIccProfile } from './IccProfile/getIccProfile'
import { replaceExif } from './exif/replaceExif'
import { replaceIccProfile } from './IccProfile/replaceIccProfile'

export type TSetting = {
  size: number
  quality?: number
}

export const shrinkFile = (file: File, settings: TSetting): Promise<Blob> => {
  /*eslint no-async-promise-executor: "off"*/
  return new Promise(async (resolve, reject) => {
    if (!(URL && DataView && Blob)) {
      reject('Not support')
    }

    try {
      const image = await shouldSkipShrink(file)
        .then((shouldSkip) => {
          if (shouldSkip) {
            return reject('Should skipped')
          }
        })
        .then(() => {
          return stripIccProfile(file).catch(() => {
            reject('Failed to strip ICC profile and not image')
          })
        })

      const exifList = Promise.allSettled([
        getExif(file),
        isBrowserApplyExif(),
        getIccProfile(file)
      ])

      exifList.then(async (results) => {
        const isRejected = results.some(
          (result) => result.status === 'rejected'
        )

        const [exif, isExifApplied, iccProfile] = results as {
          // TODO: fix this
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          value: any
          status: string
        }[]
        const isJPEG = !isRejected

        return shrinkImage(image as HTMLImageElement, settings)
          .then(async (canvas) => {
            let format = 'image/jpeg'
            let quality: number | undefined = settings?.quality || 0.8

            if (!isJPEG && hasTransparency(canvas)) {
              format = 'image/png'
              quality = undefined
            }

            canvasToBlob(canvas, format, quality, (blob) => {
              canvas.width = canvas.height = 1

              let replaceChain = Promise.resolve(blob)

              if (exif.value) {
                // @ts-expect-error TODO: fix this
                replaceChain = replaceChain
                  .then((blob) =>
                    // @ts-expect-error TODO: fix this
                    replaceExif(blob, exif.value, isExifApplied.value)
                  )
                  .catch(() => blob)
              }

              if (iccProfile?.value?.length > 0) {
                // @ts-expect-error TODO: fix this
                replaceChain = replaceChain
                  // @ts-expect-error TODO: fix this
                  .then((blob) => replaceIccProfile(blob, iccProfile.value))
                  .catch(() => blob)
              }

              // @ts-expect-error TODO: fix this
              replaceChain.then(resolve).catch(() => resolve(blob))
            })
          })
          .catch(() => reject(file))
      })
    } catch (e) {
      reject(`Failed to shrink image: ${e}`)
    }
  })
}
