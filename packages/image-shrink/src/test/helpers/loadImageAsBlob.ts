export const loadImageAsBlob = async (
  moduleResolver: () => Promise<{ default: string }>
) => {
  const imageUrl = await moduleResolver().then((module) => module.default)
  const response = await fetch(imageUrl)
  const buffer = await response.arrayBuffer()
  return new Blob([buffer], {
    type: response.headers.get('content-type') ?? 'application/octet-stream'
  })
}
