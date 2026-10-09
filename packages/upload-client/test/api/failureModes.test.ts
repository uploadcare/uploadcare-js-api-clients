import http from 'node:http'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NetworkError } from '@uploadcare/api-client-utils'
import { resetSession } from '@uploadcare/api-emulator'
import base from '../../src/api/base'
import { UploadError } from '../../src/tools/UploadError'
import * as factory from '../_fixtureFactory'
import { UUID, getSettingsForTesting } from '../_helpers'

const upload = () =>
  base(
    factory.image('blackSquare').data,
    getSettingsForTesting({ publicKey: factory.publicKey('demo') })
  )

const answerBase = (answer: () => Response, times?: number) =>
  resetSession().on('POST /base/', answer, { times })

/**
 * How the client fails when the server or the connection does. The emulator
 * answers these on demand; the real API can't be made to, so they don't run in
 * production.
 */
describe.skipIf(process.env.TEST_ENV === 'production')('failure modes', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('rejects a 5xx with an error body as an UploadError, without retrying', async () => {
    const session = answerBase(() =>
      Response.json(
        { error: { status_code: 500, content: 'Internal error.' } },
        { status: 500 }
      )
    )

    const uploaded = upload()
    await expect(uploaded).rejects.toThrow(UploadError)
    await expect(uploaded).rejects.toThrow('Internal error.')
    expect(session.requests).toHaveLength(1)
  })

  it('rejects a 5xx with a plain-text body as a SyntaxError, without retrying', async () => {
    const session = answerBase(
      () => new Response('Internal Server Error', { status: 500 })
    )

    await expect(upload()).rejects.toThrow(SyntaxError)
    expect(session.requests).toHaveLength(1)
  })

  it('rejects a 200 whose body is not JSON as a SyntaxError, without retrying', async () => {
    const session = answerBase(() => new Response('not json'))

    await expect(upload()).rejects.toThrow(SyntaxError)
    expect(session.requests).toHaveLength(1)
  })

  // The server may have acted on a request it dropped on a fresh connection,
  // so the client doesn't send it again.
  it('rejects a connection dropped on a fresh socket, without retrying', async () => {
    http.globalAgent.destroy()
    const session = answerBase(() => Response.error())

    const error = await upload().catch((e: unknown) => e)
    expect(error).not.toBeInstanceOf(NetworkError)
    expect(error).toMatchObject({ code: 'ECONNRESET' })
    expect(session.requests).toHaveLength(1)
  })

  // A pooled keep-alive socket the server closed fails the next request before
  // the server saw it; that one is a NetworkError, retried on a fresh socket.
  it('retries a connection dropped on a reused socket and resolves', async () => {
    await upload()
    const session = answerBase(() => Response.error(), 1)
    vi.useFakeTimers({ shouldAdvanceTime: true })

    const uploaded = upload()
    await vi.waitFor(() => expect(session.requests).toHaveLength(1))
    await vi.advanceTimersByTimeAsync(1000)

    await expect(uploaded).resolves.toMatchObject({
      file: expect.stringMatching(UUID)
    })
    expect(session.requests).toHaveLength(2)
  })
})
