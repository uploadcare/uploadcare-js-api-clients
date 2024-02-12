import { replaceIccProfile } from './replaceIccProfile'
import { imageLoader } from '../image/imageLoader'

export const stripIccProfile = (inputFile: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    replaceIccProfile(inputFile, [])
      .then((file: Blob) => {
        console.log({ file }, typeof file)
        imageLoader(URL.createObjectURL(file))
          .then((img) => {
            resolve(img)
            return img
          })
          .then((img) => {
            URL.revokeObjectURL(img.src)
          })
          .catch(() => {
            reject('Failed to load image')
          })
      })
      .catch(() => {
        reject('Failed to strip ICC profile and not image')
      })
  })
}
