// 2x1 pixel image 90CW rotated with orientation header
const base64ImageSrc =
  'data:image/jpg;base64,' +
  '/9j/4AAQSkZJRgABAQEASABIAAD/4QA6RXhpZgAATU0AKgAAAAgAAwESAAMAAAABAAYAAAEo' +
  'AAMAAAABAAIAAAITAAMAAAABAAEAAAAAAAD/2wBDAP//////////////////////////////' +
  '////////////////////////////////////////////////////////wAALCAABAAIBASIA' +
  '/8QAJgABAAAAAAAAAAAAAAAAAAAAAxABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAAPwBH/9k='

let isApplied: boolean | undefined = undefined

export const isBrowserApplyExifOrientation = () => {
  return new Promise<boolean>((resolve) => {
    if (isApplied !== undefined) {
      resolve(isApplied)
    } else {
      const image = new Image()

      image.addEventListener('load', () => {
        isApplied = image.naturalWidth < image.naturalHeight
        image.src = '//:0'
        resolve(isApplied)
      })

      image.src = base64ImageSrc
    }
  })
}
