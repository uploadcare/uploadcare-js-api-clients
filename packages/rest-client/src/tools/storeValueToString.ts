import { StoreValue } from '../types/StoreValue'
import { RestClientError } from './RestClientError'

export const storeValueToString = (store?: StoreValue): string | undefined => {
  if (typeof store === 'boolean') {
    return store ? 'true' : 'false'
  }
  if (!store || store === 'auto') {
    return undefined
  }
  throw new RestClientError(
    'Invalid `store` option value. Expected `true`, `false` our `"auto"`'
  )
}
