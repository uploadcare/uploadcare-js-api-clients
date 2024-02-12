// Path: packages/image-shrink/src/constans
export { allowLayers, markers, sizes } from './constans'

// Path: packages/image-shrink/src/helper
export { memoize, memoKeySerializer } from './helper/memoize'

export { shrinkFile, type TSetting } from './utils/shrinkFile'

export { shrinkImage, STEP } from './utils/shrinkImage'

export { shouldSkipShrink } from './utils/shouldSkipShrink'

export {
  canvasResize,
  canvasTest,
  testCanvasSize,
  createCanvas,
  canvasToBlob,
  hasTransparency
} from './utils/canvas'

export { isIOS, isIpadOS } from './utils/devices/mobile'

export { findExifOrientation } from './utils/exif/findExifOrientation'
export { getExif } from './utils/exif/getExif'
export { isBrowserApplyExif } from './utils/exif/isBrowserApplyExif'
export { replaceExif } from './utils/exif/replaceExif'

export { getIccProfile } from './utils/IccProfile/getIccProfile'
export { replaceIccProfile } from './utils/IccProfile/replaceIccProfile'
export { stripIccProfile } from './utils/IccProfile/stripIccProfile'

export { imageLoader } from './utils/image/imageLoader'

export { replaceJpegChunk } from './utils/image/JPEG/replaceJpegChunk'
export { readJpegChunks } from './utils/image/JPEG/readJpegChunks'

export { fallback, native } from './utils/render'
