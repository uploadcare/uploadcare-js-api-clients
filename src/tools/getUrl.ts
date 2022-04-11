type BaseTypes = string | number | void

type Query = {
  [key: string]: BaseTypes | BaseTypes[] | { [key: string]: BaseTypes }
}

const serializePair = (key: string, value: BaseTypes): string | null =>
  typeof value !== 'undefined' ? `${key}=${encodeURIComponent(value)}` : null

// TODO: generalize value transforming logic and use it here and inside `buildFormData`
const createQuery = (query: Query): string =>
  Object.entries(query)
    .reduce<(string | null)[]>((params, [key, value]) => {
      let param
      if (typeof value === 'object' && !Array.isArray(value)) {
        param = Object.entries(value)
          .filter((entry) => typeof entry[1] !== 'undefined')
          .map((entry) =>
            serializePair(`${key}[${entry[0]}]`, String(entry[1]))
          )
      } else if (Array.isArray(value)) {
        param = value.map((val) => serializePair(`${key}[]`, val))
      } else {
        param = serializePair(key, value)
      }

      return params.concat(param)
    }, [])
    .filter((x) => !!x)
    .join('&')

const getUrl = (base: string, path: string, query?: Query): string =>
  [
    base,
    path,
    query && Object.keys(query).length > 0 ? '?' : '',
    query && createQuery(query)
  ]
    .filter(Boolean)
    .join('')

export default getUrl
