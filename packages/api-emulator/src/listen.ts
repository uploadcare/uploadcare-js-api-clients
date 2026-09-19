import {
  createServer as createHttpServer,
  type IncomingMessage,
  type ServerResponse
} from 'node:http'
import { createServer as createHttpsServer } from 'node:https'
// Registers the routes as a side effect; `router.js` alone knows nothing about them.
import { handle } from './index.js'
import { DROP_CONNECTION_MARKER } from './apis/upload/scenarios.js'

export type EmulatorServerOptions = {
  /** 0, the default, takes whatever port is free. */
  port?: number
  /**
   * Serve over TLS. Playwright will only redirect a request to the protocol it
   * was made with.
   */
  tls?: { key: string; cert: string }
  /**
   * Milliseconds to wait before answering each request. A same-process,
   * in-memory handler answers before the event loop even turns over, which
   * starves a race the real API always loses: an `AbortController` fired right
   * after the request goes out never wins against a response that's already
   * there. Defaults to 30, matching the old Koa mock server's `delayer`
   * middleware. A caller that doesn't need the race won — a suite driving
   * hundreds of requests through this server, say — passes 0.
   */
  delayMs?: number
}

const bodyOf = async (request: IncomingMessage) => {
  if (request.method === 'GET' || request.method === 'HEAD') return null
  const chunks: Buffer[] = []
  try {
    for await (const chunk of request) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
  } catch (error) {
    // A client that disconnects mid-request (an aborted `fetch`, a dropped
    // connection) ends the body stream early — Node's http server throws an
    // `aborted`/`ECONNRESET` error into whatever is consuming that stream,
    // here the `for await`. That's a normal event, not a bug: there is no
    // client left to answer, so the caller (the `listener` below) checks
    // `request.aborted` and skips responding instead of this rejecting into
    // it. (`request.destroyed` is *not* the right check here — the stream
    // auto-destroys itself after a completely normal read too.)
    if (request.aborted) return null
    throw error
  }
  return new Uint8Array(Buffer.concat(chunks))
}

const headersOf = (request: IncomingMessage) => {
  const headers = new Headers()
  for (const [name, value] of Object.entries(request.headers)) {
    if (value !== undefined)
      headers.set(name, Array.isArray(value) ? value.join(', ') : value)
  }
  return headers
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const createEmulatorServer = async (
  options: EmulatorServerOptions = {}
) => {
  const listener = async (
    request: IncomingMessage,
    response: ServerResponse
  ) => {
    // Neither side should ever crash the process over a disconnect: an
    // aborted client is an ordinary event for an HTTP server, handled below
    // by simply not responding, not an error. These are a last-resort net
    // for whatever's left — an EventEmitter with no 'error' listener throws
    // on one, which would otherwise take the whole server down over, say, a
    // write to a socket that closed a moment after we checked it.
    request.on('error', () => {})
    response.on('error', () => {})

    const protocol = options.tls ? 'https' : 'http'
    const url = `${protocol}://${request.headers.host ?? 'localhost'}${request.url ?? '/'}`
    await delay(options.delayMs ?? 30)
    const body = await bodyOf(request)
    if (request.aborted) return

    const answer = await handle(
      new Request(url, {
        method: request.method,
        headers: headersOf(request),
        body
      })
    )
    if (request.aborted) return

    // See DROP_CONNECTION_MARKER (scenarios.ts): a part PUT that leaked an
    // Authorization header answers with this marker instead of a normal
    // status, since the client ignores the status of a part PUT anyway —
    // only actually dropping the connection, as the real presigned-URL
    // endpoint would, fails a test over it.
    if (answer?.headers.has(DROP_CONNECTION_MARKER)) {
      request.socket.destroy()
      return
    }

    try {
      if (!answer) {
        response
          .writeHead(502, { 'access-control-allow-origin': '*' })
          .end('not handled by the emulator')
        return
      }
      response.writeHead(answer.status, {
        ...Object.fromEntries(answer.headers),
        'access-control-allow-origin': '*'
      })
      response.end(Buffer.from(await answer.arrayBuffer()))
    } catch (error) {
      // The client disconnected between our check above and the write
      // itself — same "nothing to answer" case, just lost the race.
      if (request.aborted) return
      throw error
    }
  }

  const server = options.tls
    ? createHttpsServer(options.tls, listener)
    : createHttpServer(listener)

  const origin = await new Promise<string>((resolve, reject) => {
    server.on('error', reject)
    server.listen(options.port ?? 0, '127.0.0.1', () => {
      const address = server.address()
      if (address === null || typeof address === 'string') {
        reject(new Error('expected the server to be listening on a port'))
        return
      }
      const protocol = options.tls ? 'https' : 'http'
      resolve(`${protocol}://127.0.0.1:${address.port}`)
    })
  })

  return {
    origin,
    close: () => new Promise<void>((done) => server.close(() => done()))
  }
}
