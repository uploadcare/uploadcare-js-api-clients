import {
  createServer as createHttpServer,
  type IncomingMessage,
  type ServerResponse
} from 'node:http'
import { createServer as createHttpsServer } from 'node:https'
// Registers the routes as a side effect; `router.js` alone knows nothing about them.
import { handle } from './index.js'

export type EmulatorServerOptions = {
  /** 0, the default, takes whatever port is free. */
  port?: number
  /**
   * Serve over TLS. Playwright will only redirect a request to the protocol it
   * was made with.
   */
  tls?: { key: string; cert: string }
}

const bodyOf = async (request: IncomingMessage) => {
  if (request.method === 'GET' || request.method === 'HEAD') return null
  const chunks: Buffer[] = []
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
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

/**
 * A same-process, in-memory handler answers before the event loop even turns
 * over, which starves races the real API always loses: an `AbortController`
 * fired right after the request goes out never wins against a response that's
 * already there. The old Koa mock server added this same delay for the same
 * reason. 0 skips it, for callers (like the `handle()` unit tests) that don't
 * need it.
 */
const RESPONSE_DELAY_MS = 30
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const createEmulatorServer = async (
  options: EmulatorServerOptions = {}
) => {
  const listener = async (
    request: IncomingMessage,
    response: ServerResponse
  ) => {
    const protocol = options.tls ? 'https' : 'http'
    const url = `${protocol}://${request.headers.host ?? 'localhost'}${request.url ?? '/'}`
    await delay(RESPONSE_DELAY_MS)
    const answer = await handle(
      new Request(url, {
        method: request.method,
        headers: headersOf(request),
        body: await bodyOf(request)
      })
    )
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
