import crypto from 'crypto'
import { Md5Function } from './Md5Function'

export const md5: Md5Function = (input: string) => {
  return crypto.createHash('md5').update(input).digest('hex')
}
