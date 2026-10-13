import { expect, it } from 'vitest'
import { createRouter, route } from '../src/core/router.js'

it('passes a request on when a matching route answers undefined', async () => {
  const handle = createRouter([
    route('GET', '/:anything/*', () => undefined),
    route('GET', '/later/', () => new Response('later'))
  ])

  const response = await handle(new Request('http://x/later/'))
  expect(await response?.text()).toBe('later')
  expect(await handle(new Request('http://x/nobody/'))).toBeUndefined()
})
