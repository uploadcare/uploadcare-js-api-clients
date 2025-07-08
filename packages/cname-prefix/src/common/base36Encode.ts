const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

export const base36Encode = (value: bigint): string => {
  if (value <= 0n) {
    return '0'
  }
  let result = ''
  while (value > 0n) {
    const remainder = value % 36n
    result = ALPHABET[Number(remainder)] + result
    value = value / 36n
  }
  return result
}
