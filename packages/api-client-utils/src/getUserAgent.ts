export type CustomUserAgentOptions = {
  publicKey: string
  libraryName: string
  libraryVersion: string
  languageName: string
  integration?: string
}

export type CustomUserAgentFn = (options: CustomUserAgentOptions) => string

export type CustomUserAgent = string | CustomUserAgentFn

export type GetUserAgentOptions = {
  libraryName: string
  libraryVersion: string
  publicKey?: string
  integration?: string
  userAgent?: CustomUserAgent | null
}

export function getUserAgent({
  libraryName,
  libraryVersion,
  userAgent,
  publicKey = '',
  integration = ''
}: GetUserAgentOptions): string {
  const languageName = 'JavaScript'

  if (typeof userAgent === 'string') {
    return userAgent
  }

  if (typeof userAgent === 'function') {
    return userAgent({
      publicKey,
      libraryName,
      libraryVersion,
      languageName,
      integration
    })
  }
  const mainInfo = [libraryName, libraryVersion, publicKey]
    .filter(Boolean)
    .join('/')
  const additionInfo = [languageName, integration].filter(Boolean).join('; ')
  return `${mainInfo} (${additionInfo})`
}
