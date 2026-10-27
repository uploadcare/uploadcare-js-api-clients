// Same signature as the Node build, which does inspect `data`; there is no
// Buffer here, so nothing ever is one.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const isBuffer = (data: unknown): data is Buffer => false
