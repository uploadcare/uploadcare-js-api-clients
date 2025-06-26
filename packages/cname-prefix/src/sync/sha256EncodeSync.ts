import { Sha256 } from './Sha256'

export function sha256EncodeSync(message: string): number {
  const hash = new Sha256()
  hash.update(message)
  const hashHexStr = hash.hex()
  const hashHexInt = parseInt(hashHexStr, 16)
  return hashHexInt
}
