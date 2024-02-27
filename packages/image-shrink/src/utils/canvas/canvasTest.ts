import { createCanvas } from './createCanvas'

// add constants
const TestPixel = {
  R: 55,
  G: 110,
  B: 165,
  A: 255
}

const FILL_STYLE = `rgba(${TestPixel.R}, ${TestPixel.G}, ${TestPixel.B}, ${
  TestPixel.A / 255
})`

type TFillRect = [number, number, number, number]

export const canvasTest = (width: number, height: number) => {
  try {
    const fill: TFillRect = [width - 1, height - 1, 1, 1] // x, y, width, height

    const { canvas: cropCvs, ctx: cropCtx } = createCanvas()
    cropCvs.width = 1
    cropCvs.height = 1

    const { canvas: testCvs, ctx: testCtx } = createCanvas()
    testCvs.width = width
    testCvs.height = height

    if (testCtx) {
      testCtx.fillStyle = FILL_STYLE
      testCtx.fillRect(...fill)

      // Render the test pixel in the bottom-right corner of the
      // test canvas in the top-left of the 1x1 crop canvas. This
      // dramatically reducing the time for getImageData to complete.
      cropCtx.drawImage(testCvs, width - 1, height - 1, 1, 1, 0, 0, 1, 1)
    }

    const imageData = cropCtx && cropCtx.getImageData(0, 0, 1, 1).data
    let isTestPass = false

    if (imageData) {
      // On IE10, imageData have type CanvasPixelArray, not Uint8ClampedArray.
      // CanvasPixelArray supports index access operations only.
      // Array buffers can't be destructuredd and compared with JSON.stringify
      isTestPass =
        imageData[0] === TestPixel.R &&
        imageData[1] === TestPixel.G &&
        imageData[2] === TestPixel.B &&
        imageData[3] === TestPixel.A
    }

    testCvs.width = testCvs.height = 1

    return isTestPass
  } catch (e) {
    console.error(`Failed to test for max canvas size of ${width}x${height}.`)
    return false
  }
}
