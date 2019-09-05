type ErrorType = {
  status?: number;
  statusText: string;
}

/**
 * Return error response.
 *
 * @param {object} ctx
 * @param {number} status
 * @param {string} statusText
 */
const error = (ctx, {status = 400, statusText}: ErrorType): void => {
  const isJson = !!ctx.query.jsonerrors

  ctx.status = status
  ctx.body = statusText

  if (isJson) {
    ctx.status = 200
    ctx.body = {
      'error': {
        'content': statusText,
        'status_code': status
      }
    }
  }
}

export default error
