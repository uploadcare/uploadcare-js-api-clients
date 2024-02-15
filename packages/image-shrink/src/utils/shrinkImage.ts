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
  return new Promise((resolve, reject) => {
    if (img.width * STEP * img.height * STEP < settings.size) {
      reject('Not required')
    }

    const sourceW = img.width
    const sourceH = img.height
    const ratio = sourceW / sourceH

    // target size shouldn't be greater than settings.size in any case
    const targetW = Math.floor(Math.sqrt(settings.size * ratio))
    const targetH = Math.floor(settings.size / Math.sqrt(settings.size * ratio))

    return testCanvasSize(targetW, targetH)
      .then(() => {
        const { ctx } = createCanvas()
        const supportNative = 'imageSmoothingQuality' in ctx

        const useNativeScaling = supportNative && !isIOS() && !isIpadOS

        return useNativeScaling
          ? native({ img, targetW, targetH })
          : fallback({ img, sourceW, targetW, targetH, step: STEP })
      })
      .then((canvas) => resolve(canvas))
      .catch(() => reject('Not supported'))
  })
}
