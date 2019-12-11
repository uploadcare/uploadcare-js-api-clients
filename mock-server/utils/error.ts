type ErrorType = {
  status?: number
  statusText: string
}

const error = (ctx, { status = 400, statusText }: ErrorType) => {
  const isJson = !!ctx.query.jsonerrors

  ctx.status = status
  ctx.body = statusText

  if (isJson) {
    ctx.status = 200
    ctx.body = {
      error: {
        content: statusText,
        status_code: status
      }
    }
  }
}

export default error
