export const fileFromUrl = async (url: string) => {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  return new File([buffer], 'some.jpeg', { type: 'image/jpeg' })
}
