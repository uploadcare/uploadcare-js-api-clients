export const replaceUrlBase = (url: string, newBase: string): string => {
  try {
    const originalUrl = new URL(url)
    const baseUrl = new URL(newBase)

    originalUrl.protocol = baseUrl.protocol
    originalUrl.hostname = baseUrl.hostname
    originalUrl.port = baseUrl.port

    return originalUrl.toString()
  } catch {
    return url
  }
}
