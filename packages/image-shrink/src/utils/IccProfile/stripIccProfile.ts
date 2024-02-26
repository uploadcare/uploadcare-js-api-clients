import { replaceIccProfile } from './replaceIccProfile'

export const stripIccProfile = async (blob: Blob): Promise<Blob> => {
  try {
    return await replaceIccProfile(blob, [])
  } catch (e) {
    throw new Error(`Failed to strip ICC profile: ${e}`)
  }
}
