// Default imports, called as `http.request`, the way `upload-client` does: the
// interceptor patches the module objects, which a named import bound before
// `reset()` doesn't see.
import http from 'node:http'
import https from 'node:https'
import type { AddressInfo } from 'node:net'

/** What a `node:http(s)` client saw: its status and body, or that it errored. */
export type NodeResult = { status: number; body: string } | { error: Error }

/**
 * A request through `node:http`/`node:https`, the way `upload-client` sends in
 * Node.
 */
export const sendNode = (
  method: string,
  url: string,
  body?: string
): Promise<NodeResult> =>
  new Promise((resolve) => {
    const send = url.startsWith('https:') ? https : http
    const req = send.request(url, { method }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () =>
        resolve({
          status: res.statusCode ?? 0,
          body: Buffer.concat(chunks).toString()
        })
      )
    })
    req.on('error', (error) => resolve({ error }))
    req.end(body)
  })

/** A real local server, so passthrough never needs the internet. */
export const startLocalServer = async () => {
  const server = http.createServer((_, res) => res.end('local'))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

export const uploadForm = (file: Blob) => {
  const form = new FormData()
  form.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  form.set('file', file, 'file.bin')
  return form
}
