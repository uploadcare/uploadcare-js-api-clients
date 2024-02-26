export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number | undefined
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const callback: BlobCallback = (blob) => {
      if (!blob) {
        reject('Failed to convert canvas to blob')
        return
      }
      resolve(blob)
    }
    canvas.toBlob(callback, type, quality)
    canvas.width = canvas.height = 1
  })
}
