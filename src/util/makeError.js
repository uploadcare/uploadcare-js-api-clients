/* @flow */
import type {UCError} from '../flow-typed'

type Options = {
  type: string,
  payload?: mixed,
  origin?: Error,
}

/**
 * Create an error object
 *
 * @export
 * @param {Options} [{type, message, origin}={}]
 * @returns {UCError}
 */
export function makeError({type, payload, origin}: Options): UCError {
  return {
    type,
    payload,
    origin,
  }
}
