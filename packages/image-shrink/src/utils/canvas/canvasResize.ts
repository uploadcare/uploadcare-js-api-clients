import { createCanvas } from './createCanvas'

export const canvasResize = (img, w, h) => {
  return new Promise((resolve, reject) => {
    try {
      const { ctx, canvas } = createCanvas()

      canvas.width = w
      canvas.height = h

      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, w, h)

      img.src = '//:0' // for image
      img.width = img.height = 1 // for canvas

      resolve(canvas)
    } catch (e) {
      reject(`Failed to resize image. ${e}`)
    }
  })
}
