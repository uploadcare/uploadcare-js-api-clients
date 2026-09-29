import { expect } from '@jest/globals'
import { AuthTokenResolverError } from '@uploadcare/signed-uploads/client'
import {
  isAuthTokenResolver,
  resolveAuthToken
} from '../../src/tools/resolveAuthToken'

describe('isAuthTokenResolver', () => {
  it('should tell a resolver from a token already in hand', () => {
    expect(isAuthTokenResolver(() => 'jwt-token')).toBe(true)
    expect(isAuthTokenResolver('jwt-token')).toBe(false)
    expect(isAuthTokenResolver(undefined)).toBe(false)
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

  it('should wrap a rejecting resolver', async () => {
    const error = await resolveAuthToken(async () => {
      throw 'nope'
    }).catch((e) => e)

    expect(error).toBeInstanceOf(AuthTokenResolverError)
    expect(error.message).toContain('nope')
  })
})
