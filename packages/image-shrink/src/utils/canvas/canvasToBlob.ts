export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number | undefined,
  callback
): void => {
  return canvas.toBlob(callback, type, quality)
}
