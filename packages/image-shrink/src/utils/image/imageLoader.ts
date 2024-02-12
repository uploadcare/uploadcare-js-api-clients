// @ts-nocheck

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
        reject(image)
      })
    }
  })
}

export const imageLoader = (
  image: File | Blob | string
): Promise<HTMLImageElement> => {
  if (image.src) {
    return processImage(image)
  }

  return processImage(new Image(), image)
}
