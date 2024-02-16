import { shrinkImage } from './shrinkImage'
import { stripIccProfile } from './IccProfile/stripIccProfile'
import { shouldSkipShrink } from './shouldSkipShrink'
import { canvasToBlob } from './canvas/canvasToBlob'
import { hasTransparency } from './canvas/hasTransparency'
import { isBrowserApplyExifOrientation } from './exif/isBrowserApplyExif'
import { getExif } from './exif/getExif'
import { getIccProfile } from './IccProfile/getIccProfile'
import { replaceExif } from './exif/replaceExif'
import { replaceIccProfile } from './IccProfile/replaceIccProfile'
import { imageLoader } from './image/imageLoader'

export type TSetting = {
  size: number
  quality?: number
}

export const shrinkFile = async (
  inputBlob: Blob,
  settings: TSetting
): Promise<Blob> => {
  try {
    const shouldSkip = await shouldSkipShrink(inputBlob)
    if (shouldSkip) {
      throw new Error('Should skipped')
    }

    // Try to extract EXIF and ICC profile
    const exifResults = await Promise.allSettled([
      getExif(inputBlob),
      isBrowserApplyExifOrientation(),
      getIccProfile(inputBlob)
    ])

    const isRejected = exifResults.some(
      (result) => result.status === 'rejected'
    )
    // If any of the promises is rejected, this is not a JPEG image
    const isJPEG = !isRejected

    const [exifResult, isExifOrientationAppliedResult, iccProfileResult] =
      exifResults

    // Load blob into the image
    const inputBlobWithoutIcc = await stripIccProfile(inputBlob).catch(
      () => inputBlob
    )
    const image = await imageLoader(URL.createObjectURL(inputBlobWithoutIcc))
    URL.revokeObjectURL(image.src)

    // Shrink the image
    const canvas = await shrinkImage(image, settings)

    let format = 'image/jpeg'
    let quality: number | undefined = settings?.quality || 0.8

    if (!isJPEG && hasTransparency(canvas)) {
      format = 'image/png'
      quality = undefined
    }

    // Convert canvas to blob
    let newBlob = await canvasToBlob(canvas, format, quality)

    // Set EXIF for the new blob
    if (isJPEG && exifResult.status === 'fulfilled' && exifResult.value) {
      const exif = exifResult.value
      const isExifOrientationApplied =
        isExifOrientationAppliedResult.status === 'fulfilled'
          ? isExifOrientationAppliedResult.value
          : false
      newBlob = await replaceExif(newBlob, exif, isExifOrientationApplied)
      // TODO: should we continue shrink if failed to replace EXIF?
      // .catch(() => newBlob)
    }

    // Set ICC profile for the new blob
    if (
      isJPEG &&
      iccProfileResult.status === 'fulfilled' &&
      iccProfileResult.value.length > 0
    ) {
      newBlob = await replaceIccProfile(newBlob, iccProfileResult.value)
      // TODO: should we continue shrink if failed to replace ICC?
      // .catch(() => newBlob)
    }

    return newBlob
  } catch (e) {
    let message: string | undefined
    if (e instanceof Error) {
      message = e.message
    }
    if (typeof e === 'string') {
      message = e
    }
    throw new Error(
      `Failed to shrink image. ${message ? `Message: "${message}".` : ''}`,
      { cause: e }
    )
  }
}
