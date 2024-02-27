import { readMagickImage } from './readMagickImage'

export const getImageAttributes = async (inputBlob: Blob) => {
  return readMagickImage(inputBlob, (image) => {
    return image.attributeNames.reduce((acc, name) => {
      return {
        ...acc,
        [name]: image.getAttribute(name)
      }
    }, {})
  })
}
