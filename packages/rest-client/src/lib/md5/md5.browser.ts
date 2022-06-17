import blueimpMd5 from 'blueimp-md5'
import { Md5Function } from './Md5Function'

export const md5: Md5Function = (input: string) => {
  return blueimpMd5(input)
}
