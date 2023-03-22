import { type createSignature as createSignatureFn } from './createSignature.node'

export const createSignature = async (
  ...args: Parameters<typeof createSignatureFn>
) => {
  const { createSignature } = await import('./createSignature.node')
  return createSignature(...args)
}
