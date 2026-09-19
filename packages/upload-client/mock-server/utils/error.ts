import { type Context } from 'koa'
import type { ServerErrorCode } from '../../src/tools/ServerErrorCode'

type ErrorType = {
  status?: number
  statusText: string
  /**
   * Typed against the client's own union, so a mock that answers with a code
   * the client does not know about fails to compile. A test asserting on a code
   * neither side sends would otherwise look like it was covering something.
   */
  errorCode?: ServerErrorCode
}

const error = (
  ctx: Context,
  { status = 400, statusText, errorCode }: ErrorType
): void => {
  const isJson = !!ctx.query.jsonerrors

  ctx.status = status
  ctx.body = statusText

  if (isJson) {
    ctx.status = 200
    ctx.body = {
      error: {
        content: statusText,
        status_code: status,
        error_code: errorCode
      }
    }
  }
}

export default error
