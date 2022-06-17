const DEFAULT_API_VERSION = '0.7'

export const getAcceptHeader = () => {
  return `application/vnd.uploadcare-v${DEFAULT_API_VERSION}+json`
}
