export const parseDoNotStore = (doNotStore?: boolean): string => {
  const store = typeof doNotStore !== 'undefined' ? (doNotStore ? '0' : '1') : 'auto'

  return store
}
