type BaseTypes = string | number | void;

type Query = {
  [key: string]: BaseTypes | BaseTypes[];
};

const arrayToQuery = (key: string, values: BaseTypes[]) =>
  values.reduce<{ [key: string]: BaseTypes }>((acc, value) => {
    acc[`${key}[]`] = value;

    return acc;
  }, {});

const createQuery = (query: Query): string =>
  Object.entries(query)
    .map(([key, value]) =>
      Array.isArray(value)
        ? createQuery(arrayToQuery(key, value))
        : `${key}=${value}`
    )
    .join("&");

const getUrl = (base: string, path: string, query: Query) =>
  `${base}${path}?${createQuery(query)}`;


export default getUrl
