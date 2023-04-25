import { StoreValue } from '@uploadcare/api-client-utils'

export function getStoreValue(store?: StoreValue): 'auto' | '0' | '1' {
  if (typeof store === 'undefined' || store === 'auto') {
    return 'auto'
  }
  return store ? '1' : '0'
}
