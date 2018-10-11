/* @flow */
import type {UCError} from '../flow-typed'

type Options = {
  type: string,
  code?: number,
  message?: string,
  error?: Error,
}

/**
 * Create an error object
 *
 * @export
 * @param {Options} [{type, message, origin}={}]
 * @returns {UCError}
 */
export function makeError({type, message, code, error}: Options): UCError {
  const msg = message || (error && error.message)

  return {
    type,
    code,
    message: msg,
    error,
  }
}
