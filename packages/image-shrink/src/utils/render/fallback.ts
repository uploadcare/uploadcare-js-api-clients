// @ts-nocheck
import { testCanvasSize } from '../canvas/testCanvasSize'
import { canvasResize } from '../canvas/canvasResize'

const calcShrinkSteps = function (sourceW, targetW, targetH, step) {
  const steps = []
  let sW = targetW
  let sH = targetH

  // result should include at least one target step,
  // even if abs(source - target) < step * source
  // just to be sure nothing will break
  // if the original resolution / target resolution condition changes
  do {
    steps.push([sW, sH])
    sW = Math.round(sW / step)
    sH = Math.round(sH / step)
  } while (sW < sourceW * step)

  return steps.reverse()
}

export const fallback = ({ img, sourceW, targetW, targetH, step }) => {
  const steps = calcShrinkSteps(sourceW, targetW, targetH, step)

  return steps
    .reduce((chain, [w, h]) => {
      return chain
        .then((canvas) => {
          return testCanvasSize(w, h)
            .then(() => canvas)
            .catch(() => canvasResize(canvas, w, h))
        })
        .then((canvas) => {
          const progress = (sourceW - w) / (sourceW - targetW)
          return { canvas, progress }
        })
    }, Promise.resolve(img))
    .then(({ canvas }) => canvas)
    .catch((error) => Promise.reject(error))
}
