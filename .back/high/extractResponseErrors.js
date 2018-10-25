/* @flow */
import type {UCResponse} from '../flow-typed'
import {makeError} from '../util/makeError'

/**
 * Extract application and server errors from response and return rejected promise
 * If no any errors then return data
 *
 * @export
 * @template T
 * @template any
 * @param {UCResponse<T>} response
 * @returns {Promise<T>}
 */
export async function extractResponseErrors<T: any>(
  response: UCResponse<T>,
): Promise<T> {
  const {code, data} = response

  if (data.error) {
    return Promise.reject(
      makeError({
        type: 'APPLICATION_ERROR',
        message: data.error.content,
        code,
      }),
    )
  }

  if (code !== 200) {
    return Promise.reject(
      makeError({
        type: 'SERVER_ERROR',
        code,
      }),
    )
  }

  return data
}
