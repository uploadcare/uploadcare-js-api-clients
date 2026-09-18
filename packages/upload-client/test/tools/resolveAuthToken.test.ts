import { expect } from '@jest/globals'
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
})
