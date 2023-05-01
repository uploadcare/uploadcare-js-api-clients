export const isBuffer = (data: unknown): data is Buffer =>
  data instanceof Buffer
