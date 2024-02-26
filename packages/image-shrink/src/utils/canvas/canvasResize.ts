import { createCanvas } from './createCanvas'

export const canvasResize = async (
  img: CanvasImageSource,
  w: number,
  h: number
) => {
  try {
    const { ctx, canvas } = createCanvas()

    canvas.width = w
    canvas.height = h

    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, w, h)

    if (img instanceof HTMLImageElement) {
      img.src = '//:0' // free memory
    }
    if (img instanceof HTMLCanvasElement) {
      img.width = img.height = 1 // free memory
    }

    return canvas
  } catch (e) {
    throw new Error('Canvas resize error', { cause: e })
  }
}
