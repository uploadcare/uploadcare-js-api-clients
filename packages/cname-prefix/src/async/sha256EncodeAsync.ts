export const sha256EncodeAsync = async (data: string): Promise<bigint> => {
  const msgUint8 = new TextEncoder().encode(data)
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHexStr = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const hashHexInt = BigInt(`0x${hashHexStr}`)
  return hashHexInt
}
