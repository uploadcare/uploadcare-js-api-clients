/** The Upload API's error envelope, as `jsonerrors=1` returns it. */
export const apiError = (status: number, content: string, errorCode?: string) =>
  Response.json(
    {
      error: {
        status_code: status,
        content,
        ...(errorCode ? { error_code: errorCode } : {})
      }
    },
    { status }
  )
