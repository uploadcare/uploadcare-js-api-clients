type ErrorType = {
  status?: number
  statusText: string
  errorCode?: string
}

/* eslint @typescript-eslint/camelcase: [2, {allow: ["status_code", "error_code"]}] */

const error = (
  ctx,
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
