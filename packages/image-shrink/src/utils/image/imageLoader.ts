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

export const imageLoader = (image: string): Promise<HTMLImageElement> => {
  return processImage(new Image(), image)
}
