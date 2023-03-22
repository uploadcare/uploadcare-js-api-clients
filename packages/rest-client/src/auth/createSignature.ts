import { type createSignature as createSignatureFn } from './createSignature.node'

export const createSignature = (
  ...args: Parameters<typeof createSignatureFn>
) => {
  return import('./createSignature.node').then((m) =>
    m.createSignature(...args)
  )
}
