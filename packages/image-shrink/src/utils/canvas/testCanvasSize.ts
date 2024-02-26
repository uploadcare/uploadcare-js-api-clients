import { sizes } from '../../constants'
import { memoize, memoKeySerializer } from '../../helper/memoize'
import { canvasTest } from './canvasTest'

function wrapAsync<A extends unknown[], R>(fn: (...args: A) => R) {
  return (...args: A) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = fn(...args)
        resolve(result)
      }, 0)
    })
  }
}

const squareTest = wrapAsync(memoize(canvasTest, memoKeySerializer))
const dimensionTest = wrapAsync(memoize(canvasTest, memoKeySerializer))

export const testCanvasSize = async (w: number, h: number) => {
  const testSquareSide = sizes.squareSide.find((side) => side * side >= w * h)
  const testDimension = sizes.dimension.find((side) => side >= w && side >= h)

  if (!testSquareSide || !testDimension) {
    throw new Error('Not supported')
  }

  const [squareSupported, dimensionSupported] = await Promise.all([
    squareTest(testSquareSide, testSquareSide),
    dimensionTest(testDimension, 1)
  ])

  if (squareSupported && dimensionSupported) {
    return true
  } else {
    throw new Error('Not supported')
  }
}
