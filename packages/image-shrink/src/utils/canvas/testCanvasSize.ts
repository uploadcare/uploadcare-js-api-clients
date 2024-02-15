import { sizes } from '../../constants'
import { memoize, memoKeySerializer } from '../../helper/memoize'
import { canvasTest } from './canvasTest'

function wrapAsync(fn) {
  return (...args) => {
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

export const testCanvasSize = (w, h) => {
  return new Promise(async (resolve, reject) => {
    const testSquareSide = sizes.squareSide.find((side) => side * side >= w * h)
    const testDimension = sizes.dimension.find((side) => side >= w && side >= h)

    if (!testSquareSide || !testDimension) {
      reject()
      return
    }

    const squareSupported = await squareTest(testSquareSide, testSquareSide)
    const dimensionSupported = await dimensionTest(testDimension, 1)

    if (squareSupported && dimensionSupported) {
      resolve(true)
    } else {
      reject()
    }
  })
}
