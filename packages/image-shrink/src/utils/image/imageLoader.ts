export const processImage = (
  image: HTMLImageElement,
  src?: string
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (src) {
      image.src = src
    }

    if (image.complete) {
      resolve(image)
    } else {
      image.addEventListener('load', () => {
        resolve(image)
      })
      image.addEventListener('error', () => {
        reject(new Error('Failed to load image. Probably not an image.'))
      })
    }
  })
}

export const imageLoader = (image: string): Promise<HTMLImageElement> => {
  return processImage(new Image(), image)
}
