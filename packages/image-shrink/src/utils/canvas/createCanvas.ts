export const createCanvas = () => {
  const canvas = document.createElement('canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

  return {
    canvas,
    ctx
  }
}
