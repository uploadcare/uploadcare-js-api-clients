import { canvasResize } from '../canvas/canvasResize'

export const native = ({ img, targetW, targetH }) =>
  canvasResize(img, targetW, targetH)
