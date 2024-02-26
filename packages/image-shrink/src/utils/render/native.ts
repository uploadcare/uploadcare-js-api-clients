import { canvasResize } from '../canvas/canvasResize'

type TNative = {
  img: HTMLImageElement
  targetW: number
  targetH: number
}

/**
 * Native high-quality canvas resampling
 *
 * Browser support:
 * https://caniuse.com/mdn-api_canvasrenderingcontext2d_imagesmoothingenabled
 * Target dimensions expected to be supported by browser.
 */
export const native = ({ img, targetW, targetH }: TNative) =>
  canvasResize(img, targetW, targetH)
