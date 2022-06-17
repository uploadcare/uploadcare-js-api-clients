export function getStoreValue(store?: 'auto' | boolean): 'auto' | '0' | '1' {
  return typeof store === 'undefined' ? 'auto' : store ? '1' : '0'
}
