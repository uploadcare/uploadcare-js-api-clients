import { canvasResize } from '../canvas/canvasResize'

/**
 * Native high-quality canvas resampling
 *
 * Browser support:
 * https://caniuse.com/mdn-api_canvasrenderingcontext2d_imagesmoothingenabled
 * Target dimensions expected to be supported by browser.
 */
export const native = ({
  img,
  targetW,
  targetH
}: {
  img: HTMLImageElement
  targetW: number
  targetH: number
}) => canvasResize(img, targetW, targetH)
