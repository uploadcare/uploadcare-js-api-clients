import version from '../version'

/**
 * Returns User Agent based on version and settings.
 */
export function getUserAgent({
  publicKey = '',
  integration = ''
}: {
  publicKey?: string
  integration?: string
} = {}): string {
  const mainInfo = [version, publicKey].filter(Boolean).join('/')
  const additionInfo = ['JavaScript', integration].filter(Boolean).join('; ')
  return `UploadcareUploadClient/${mainInfo} (${additionInfo})`
}
