/**
 * Exercises the built bundles, not `src`.
 *
 * The build mangles `_`-prefixed properties, which the unit tests cannot catch:
 * they import source, where the names are intact. Anything that reads a private
 * member across a boundary terser cannot see would pass every test and fail
 * here.
 */
import assert from 'node:assert/strict'
import { createHash, createHmac } from 'node:crypto'

const base64url = (value) => Buffer.from(value).toString('base64url')
const tokenExpiringIn = (seconds) =>
  `header.${base64url(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds })
  )}.signature`

const checks = []
const check = (name, fn) => checks.push([name, fn])

check('client ESM: caches, dedupes, invalidates', async () => {
  const { AuthTokenCache, getAuthHeaders, getTokenExpiration } =
    await import('../dist/client.js')

  const exp = Math.floor(Date.now() / 1000) + 3600
  const token = `header.${base64url(JSON.stringify({ exp }))}.signature`
  assert.equal(getTokenExpiration(token), exp)
  assert.deepEqual(getAuthHeaders('abc'), { Authorization: 'Bearer abc' })
  assert.deepEqual(getAuthHeaders(undefined), {})

  let calls = 0
  const cache = new AuthTokenCache({
    fetchToken: () => {
      calls += 1
      return token
    }
  })

  // Concurrent callers share one fetch, and the token is reused after.
  const [a, b] = await Promise.all([cache.getToken(), cache.getToken()])
  assert.equal(a, token)
  assert.equal(b, token)
  assert.equal(await cache.getToken(), token)
  assert.equal(calls, 1, 'expected one fetch for three reads')

  cache.invalidate()
  await cache.getToken()
  assert.equal(calls, 2, 'invalidate() should force a refetch')
})

check('client ESM: refreshes inside the skew window', async () => {
  const { AuthTokenCache } = await import('../dist/client.js')

  let calls = 0
  const cache = new AuthTokenCache({
    // 10s of life, well inside the 30s default skew, so it is stale on arrival.
    fetchToken: () => {
      calls += 1
      return tokenExpiringIn(10)
    }
  })

  await cache.getToken()
  await cache.getToken()
  assert.equal(calls, 2, 'a token inside the skew window should not be reused')
})

check('client ESM: keeps a token whose exp it cannot read', async () => {
  const { AuthTokenCache } = await import('../dist/client.js')

  let calls = 0
  const cache = new AuthTokenCache({
    fetchToken: () => {
      calls += 1
      return 'opaque'
    }
  })

  await cache.getToken()
  await cache.getToken()
  assert.equal(calls, 1, 'an unreadable exp should not trigger a refetch')
})

check('client ESM: a swapped fetchToken keeps the cached token', async () => {
  const { AuthTokenCache } = await import('../dist/client.js')

  const cache = new AuthTokenCache({ fetchToken: () => tokenExpiringIn(3600) })
  const first = await cache.getToken()

  let secondCalled = false
  cache.fetchToken = () => {
    secondCalled = true
    return tokenExpiringIn(3600)
  }

  assert.equal(await cache.getToken(), first)
  assert.equal(secondCalled, false)
})

check('client CJS: loads and works', async () => {
  const { createRequire } = await import('node:module')
  const require = createRequire(import.meta.url)
  const { AuthTokenCache, getAuthHeaders } = require('../dist/client.cjs')

  assert.deepEqual(getAuthHeaders('abc'), { Authorization: 'Bearer abc' })
  const token = tokenExpiringIn(3600)
  assert.equal(
    await new AuthTokenCache({ fetchToken: () => token }).getToken(),
    token
  )
})

check('server ESM: mints a token the Upload API would accept', async () => {
  const { generateAuthToken, generateSecureSignature } =
    await import('../dist/server.js')

  const secret = 'YOUR_SECRET_KEY'
  const jwt = generateAuthToken(secret, {
    lifetime: 30 * 60 * 1000,
    scope: ['/base/'],
    operations: 5
  })

  const [header, payload, signature] = jwt.split('.')
  const key = createHash('sha256').update(secret, 'utf8').digest()
  const expected = createHmac('sha256', key)
    .update(`${header}.${payload}`)
    .digest('base64url')
  assert.equal(signature, expected, 'signature must verify')

  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString())
  assert.equal(typeof claims.exp, 'number')
  assert.equal(typeof claims.iat, 'number')
  assert.deepEqual(claims.uc, {
    restrictions: { scope: ['/base/'], limits: { operations: 5 } }
  })

  assert.throws(
    () => generateAuthToken(secret, { lifetime: 25 * 60 * 60 * 1000 }),
    /86400/,
    'the lifetime ceiling must still be enforced in the bundle'
  )

  const { secureSignature, secureExpire } = generateSecureSignature(secret, {
    lifetime: 60_000
  })
  assert.match(secureSignature, /^[a-f0-9]{64}$/)
  assert.match(secureExpire, /^\d+$/)
})

check('root entry re-exports the server API', async () => {
  const root = await import('../dist/index.js')
  assert.equal(typeof root.generateAuthToken, 'function')
  assert.equal(typeof root.generateSecureSignature, 'function')
})

let failed = 0
for (const [name, fn] of checks) {
  try {
    await fn()
    console.log(`  ok  ${name}`)
  } catch (error) {
    failed += 1
    console.error(`fail  ${name}`)
    console.error(`      ${error.message}`)
  }
}

if (failed > 0) {
  console.error(`\n${failed} of ${checks.length} dist checks failed`)
  process.exit(1)
}
console.log(`\n${checks.length} dist checks passed`)
