import net from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { NetworkError } from '@uploadcare/api-client-utils'
import request from '../../src/request/request.node'

/**
 * A server that answers the first `answered` requests on each connection and
 * resets the connection on the next one, the way a server that has dropped an
 * idle keep-alive connection answers a request sent down it.
 */
const resettingServer = async (answered: number) => {
  const server = net.createServer((socket) => {
    let seen = 0
    socket.on('data', () => {
      seen += 1
      if (seen > answered) socket.resetAndDestroy()
      else socket.write('HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nok')
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as net.AddressInfo
  servers.push(server)
  return `http://127.0.0.1:${port}/`
}

const servers: net.Server[] = []
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections?.()
    await new Promise((resolve) => server.close(resolve))
  }
})

describe('request (node)', () => {
  it('rejects with a NetworkError when a reused keep-alive socket is reset', async () => {
    const url = await resettingServer(1)
    await expect(request({ url })).resolves.toMatchObject({ status: 200 })

    await expect(request({ url })).rejects.toBeInstanceOf(NetworkError)
  })

  it('rejects with the socket error when a fresh connection is reset', async () => {
    const url = await resettingServer(0)

    const error = await request({ url }).catch((error: unknown) => error)

    expect(error).not.toBeInstanceOf(NetworkError)
    expect(error).toMatchObject({ code: 'ECONNRESET' })
  })
})
