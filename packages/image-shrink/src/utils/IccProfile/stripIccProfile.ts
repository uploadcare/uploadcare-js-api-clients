import { replaceIccProfile } from './replaceIccProfile'
import { imageLoader } from '../image/imageLoader'

export const stripIccProfile = async (
  inputFile: File
): Promise<HTMLImageElement> => {
  try {
    const file = await replaceIccProfile(inputFile, [])
    const image = await imageLoader(URL.createObjectURL(file))

    URL.revokeObjectURL(image.src)

    return image
  } catch (e) {
    throw new Error(`Failed to strip ICC profile and not image ${e}`)
  }
}
