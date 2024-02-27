import { createCanvas } from './createCanvas'

export const hasTransparency = (img: CanvasImageSource) => {
  const canvasSize = 50

  // Create a canvas element and get 2D rendering context
  const { ctx, canvas } = createCanvas()
  canvas.width = canvas.height = canvasSize

  // Draw the image onto the canvas
  ctx.drawImage(img, 0, 0, canvasSize, canvasSize)

  // Get the image data
  const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize).data

  // Reset the canvas dimensions
  canvas.width = canvas.height = 1

  // Check for transparency in the alpha channel
  for (let i = 3; i < imageData.length; i += 4) {
    if (imageData[i] < 254) {
      return true
    }
  }

  // No transparency found
  return false
}
