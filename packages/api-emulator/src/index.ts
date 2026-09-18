export const handle = async (
  request: Request
): Promise<Response | undefined> =>
  new URL(request.url).pathname === '/ping/'
    ? Response.json({ pong: true })
    : undefined
