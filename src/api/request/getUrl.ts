type BaseTypes = string | number;

type Query = {
  [key: string]: BaseTypes | BaseTypes[];
};

const createQuery = (query: Query): string =>
  Object.entries(query)
    .reduce<string[]>(
      (params, [key, value]) =>
        params.concat(
          Array.isArray(value)
            ? value.map(value => `${key}[]=${encodeURIComponent(value)}`)
            : `${key}=${encodeURIComponent(value)}`
        ),
      []
    )
    .join("&");

const getUrl = (base: string, path: string, query?: Query) =>
  [
    base,
    path,
    query && Object.keys(query).length > 0 ? "?" : "",
    query && createQuery(query)
  ]
    .filter(Boolean)
    .join("");

export default getUrl;
