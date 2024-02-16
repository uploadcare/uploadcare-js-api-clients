export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number | undefined,
  callback: BlobCallback
): void => {
  return canvas.toBlob(callback, type, quality)
}
