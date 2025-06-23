export const sha256Encode = async (data: string): Promise<number> => {
  const msgUint8 = new TextEncoder().encode(data)
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHexStr = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const hashHexInt = parseInt(hashHexStr, 16)
  return hashHexInt
}
