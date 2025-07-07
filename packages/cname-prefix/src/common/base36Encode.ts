const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

export const base36Encode = (value: number): string => {
  if (value <= 0) {
    return '0'
  }
  let result = ''
  while (value > 0) {
    const remainder = value % 36
    result = ALPHABET[remainder] + result
    value = Math.floor(value / 36)
  }
  return result
}
