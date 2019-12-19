const version = '1.0.0alpha-amega'
/**
 * Returns User Agent based on version and settings.
 *
 * @param {SettingsInterface} [settings]
 * @returns {string}
 */
export function getUserAgent({
  publicKey = '',
  integration = ''
}: {
  publicKey?: string
  integration?: string
} = {}): string {
  const mainInfo = [version, publicKey].join('/')
  const additionInfo = ['JavaScript', integration].join('; ')
  return `UploadcareUploadClient/${mainInfo} (${additionInfo})`
}
