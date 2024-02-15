export const memoize = (fn, serializer) => {
  const cache = {}
  return (...args) => {
    const key = serializer(args, cache)
    return key in cache ? cache[key] : (cache[key] = fn(...args))
  }
}

/**
 * Memoization key serealizer, that prevents unnecessary canvas tests. No need
 * to make test if we know that:
 *
 * - Browser supports higher canvas size
 * - Browser doesn't support lower canvas size
 */
export const memoKeySerializer = (args, cache) => {
  const [w] = args
  const cachedWidths = Object.keys(cache)
    .map((val) => parseInt(val, 10))
    .sort((a, b) => a - b)

  for (let i = 0; i < cachedWidths.length; i++) {
    const cachedWidth = cachedWidths[i]
    const isSupported = !!cache[cachedWidth]
    // higher supported canvas size, return it
    if (cachedWidth > w && isSupported) {
      return cachedWidth
    }
    // lower unsupported canvas size, return it
    if (cachedWidth < w && !isSupported) {
      return cachedWidth
    }
  }

  // use canvas width as the key,
  // because we're doing dimension test by width - [dimension, 1]
  return w
}
