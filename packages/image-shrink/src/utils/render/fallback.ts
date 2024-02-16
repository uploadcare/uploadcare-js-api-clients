import { testCanvasSize } from '../canvas/testCanvasSize'
import { canvasResize } from '../canvas/canvasResize'

const calcShrinkSteps = function (
  sourceW: number,
  targetW: number,
  targetH: number,
  step: number
) {
  const steps: Array<[number, number]> = []
  let sW: number = targetW
  let sH: number = targetH

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

export const fallback = ({
  img,
  sourceW,
  targetW,
  targetH,
  step
}: {
  img: HTMLImageElement
  sourceW: number
  targetW: number
  targetH: number
  step: number
}): Promise<HTMLCanvasElement> => {
  const steps = calcShrinkSteps(sourceW, targetW, targetH, step)

  return (
    steps
      // @ts-expect-error TODO: fix this
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
      // @ts-expect-error TODO: fix this
      .then(({ canvas }) => canvas)
      // @ts-expect-error TODO: remove this
      .catch((error) => Promise.reject(error))
  )
}
