import { testCanvasSize } from './canvas/testCanvasSize'
import { createCanvas } from './canvas/createCanvas'
import { native } from './render/native'
import { fallback } from './render/fallback'
import { isIOS, isIpadOS } from './devices/mobile'
import { TSetting } from './shrinkFile'

export const STEP = 0.71 // should be > sqrt(0.5)

export const shrinkImage = (
  img: HTMLImageElement,
  settings: TSetting
): Promise<HTMLCanvasElement> => {
  // do not shrink image if original resolution / target resolution ratio falls behind 2.0
  if (img.width * STEP * img.height * STEP < settings.size) {
    throw new Error('Not required')
  }

  const sourceW = img.width
  const sourceH = img.height
  const ratio = sourceW / sourceH

  // target size shouldn't be greater than settings.size in any case
  const targetW = Math.floor(Math.sqrt(settings.size * ratio))
  const targetH = Math.floor(settings.size / Math.sqrt(settings.size * ratio))

  // we test the last step because we can skip all intermediate steps
  return testCanvasSize(targetW, targetH)
    .then(() => {
      const { ctx } = createCanvas()
      const supportNative = 'imageSmoothingQuality' in ctx

      // native scaling on ios gives blurry results
      // TODO: check if it's still true
      const useNativeScaling = supportNative && !isIOS() && !isIpadOS

      return useNativeScaling
        ? native({ img, targetW, targetH })
        : fallback({ img, sourceW, targetW, targetH, step: STEP })
    })
    .catch(() => Promise.reject('Not supported'))
}
