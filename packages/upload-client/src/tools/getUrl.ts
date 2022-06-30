type Query = Record<string, unknown>

const buildSearchParams = (query: Query): string => {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value)
        .filter((entry) => entry[1] ?? false)
        .forEach((entry) =>
          searchParams.set(`${key}[${entry[0]}]`, String(entry[1]))
        )
    } else if (Array.isArray(value)) {
      value.forEach((val) => {
        searchParams.append(`${key}[]`, val)
      })
    } else if (typeof value === 'string' && value) {
      searchParams.set(key, value)
    } else if (typeof value === 'number') {
      searchParams.set(key, value.toString())
    }
  }

  return searchParams.toString()
}

const getUrl = (base: string, path: string, query?: Query): string => {
  const url = new URL(base)
  url.pathname = path
  if (query) {
    url.search = buildSearchParams(query)
  }
  return url.toString()
}

export default getUrl
