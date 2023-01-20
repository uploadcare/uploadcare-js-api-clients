import { StoreValue } from '../types'

export function getStoreValue(store?: StoreValue): 'auto' | '0' | '1' {
  if (typeof store === 'undefined' || store === 'auto') {
    return 'auto'
  }
  return store ? '1' : '0'
}
