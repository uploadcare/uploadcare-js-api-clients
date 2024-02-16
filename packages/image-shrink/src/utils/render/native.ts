import { canvasResize } from '../canvas/canvasResize'

export const native = ({
  img,
  targetW,
  targetH
}: {
  img: HTMLImageElement
  targetW: number
  targetH: number
}) => canvasResize(img, targetW, targetH)
