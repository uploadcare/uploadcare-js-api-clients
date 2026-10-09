import { expect, describe, it } from 'vitest'
import { AuthTokenResolverError } from '@uploadcare/signed-uploads/client'
import {
  isAuthTokenResolver,
  normalizeAuthToken,
  resolveAuthToken
} from '../../src/tools/resolveAuthToken'

describe('isAuthTokenResolver', () => {
  it('should tell a resolver from a token already in hand', () => {
    expect(isAuthTokenResolver(() => 'jwt-token')).toBe(true)
    expect(isAuthTokenResolver('jwt-token')).toBe(false)
    expect(isAuthTokenResolver(undefined)).toBe(false)
  })
})

describe('the provider form', () => {
  it('should call `getToken` on an object', async () => {
    const provider = { getToken: () => 'token-from-provider' }
    await expect(resolveAuthToken(provider)).resolves.toBe(
      'token-from-provider'
    )
  })

  it('should keep `this`, so a class instance can be passed as is', async () => {
    class Cache {
      private _token = 'bound-token'
      getToken(): string {
        return this._token
      }
      invalidate(): void {
        this._token = 'second-token'
      }
    }
    const cache = new Cache()
    await expect(resolveAuthToken(cache)).resolves.toBe('bound-token')

    // Taken off the object by `normalizeAuthToken`, so it has to stay bound.
    normalizeAuthToken(cache).invalidate?.()
    await expect(resolveAuthToken(cache)).resolves.toBe('second-token')
  })

  it('should count a provider as a resolver', () => {
    expect(isAuthTokenResolver({ getToken: () => 'token' })).toBe(true)
  })

  it('should reject an object without `getToken`', async () => {
    // The alternative is a request with no header, which comes back as
    // `SignatureRequiredError` pointing nowhere near the real mistake. Not an
    // `AuthTokenResolverError`: nothing resolved, the option is malformed.
    await expect(
      resolveAuthToken({ invalidate: () => {} } as never)
    ).rejects.toThrow(TypeError)
  })

  it('should answer the predicate without throwing on a malformed option', () => {
    // A type guard that throws is a trap for anything branching on it.
    expect(isAuthTokenResolver({ invalidate: () => {} } as never)).toBe(false)
    expect(isAuthTokenResolver({} as never)).toBe(false)
    expect(isAuthTokenResolver(null as never)).toBe(false)
  })

  it('should leave `invalidate` undefined for a plain function', () => {
    expect(normalizeAuthToken(() => 'token').invalidate).toBeUndefined()
  })
})

describe('resolveAuthToken', () => {
  it('should pass a plain token through', async () => {
    await expect(resolveAuthToken('jwt-token')).resolves.toBe('jwt-token')
  })

  it('should call a sync resolver', async () => {
    await expect(resolveAuthToken(() => 'jwt-token')).resolves.toBe('jwt-token')
  })

  it('should await an async resolver', async () => {
    await expect(resolveAuthToken(async () => 'jwt-token')).resolves.toBe(
      'jwt-token'
    )
  })

  it('should resolve to undefined without a token', async () => {
    await expect(resolveAuthToken(undefined)).resolves.toBeUndefined()
  })

  it('should call the resolver on every call, so a token can rotate', async () => {
    let n = 0
    const resolver = () => `jwt-${++n}`

    await expect(resolveAuthToken(resolver)).resolves.toBe('jwt-1')
    await expect(resolveAuthToken(resolver)).resolves.toBe('jwt-2')
  })

  it('should wrap a throwing resolver, keeping the original on cause', async () => {
    const cause = new Error('token endpoint is down')

    const error = await resolveAuthToken(() => {
      throw cause
    }).catch((e) => e)

    expect(error).toBeInstanceOf(AuthTokenResolverError)
    expect(error.name).toBe('AuthTokenResolverError')
    expect(error.message).toContain('token endpoint is down')
    expect(error.cause).toBe(cause)
  })

  it('should not nest when the resolver already threw a wrapped error', async () => {
    const inner = new AuthTokenResolverError(new Error('cache failed'))

    const error = await resolveAuthToken(() => {
      throw inner
    }).catch((e) => e)

    expect(error).toBe(inner)
  })

  it.each([undefined, '', null])(
    'should reject a resolver that returns %o rather than send no header',
    async (value) => {
      const error = await resolveAuthToken(
        () => value as unknown as string
      ).catch((e) => e)

      expect(error).toBeInstanceOf(AuthTokenResolverError)
      expect(error.message).toContain('token function returned no token')
    }
  )

  it('should wrap a rejecting resolver', async () => {
    const error = await resolveAuthToken(async () => {
      throw 'nope'
    }).catch((e) => e)

    expect(error).toBeInstanceOf(AuthTokenResolverError)
    expect(error.message).toContain('nope')
  })
})
