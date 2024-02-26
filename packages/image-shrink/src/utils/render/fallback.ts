import { testCanvasSize } from '../canvas/testCanvasSize'
import { canvasResize } from '../canvas/canvasResize'

/**
 * Goes from target to source by step, the last incomplete step is dropped.
 * Always returns at least one step - target. Source step is not included.
 * Sorted descending.
 *
 * Example with step = 0.71, source = 2000, target = 400 400 (target) <- 563 <-
 * 793 <- 1117 <- 1574 (dropped) <- [2000 (source)]
 */
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

/**
 * Fallback resampling algorithm
 *
 * Reduces dimensions by step until reaches target dimensions, this gives a
 * better output quality than one-step method
 *
 * Target dimensions expected to be supported by browser, unsupported steps will
 * be dropped.
 */
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

  return steps.reduce(
    (chain, [w, h]) => {
      return chain.then((canvas) => {
        return (
          testCanvasSize(w, h)
            .then(() => canvasResize(canvas, w, h))
            // Here we assume that at least one step will be supported and HTMLImageElement will be converted to HTMLCanvasElement
            .catch(() => canvas as unknown as HTMLCanvasElement)
        )
      })
    },
    Promise.resolve(img as HTMLCanvasElement | HTMLImageElement)
  ) as Promise<HTMLCanvasElement>
}
