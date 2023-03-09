import { generateSecureSignature } from './generateSecureSignature'
import { jest, expect } from '@jest/globals'

const FIXTURE_SECRET = 'YOUR_SECRET_KEY'
const FIXTURE_LIFETIME = 60 * 30 // 30 minutes
const FIXTURE_DATE = new Date('2020-01-01')
const EXPECTED_SIGNATURE =
  '05408f1b19041fdead801dd5a540c48bd725f9570e24da613a91da8891cafae1'

describe('generateSecureSignature', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(FIXTURE_DATE)
  })

  it('should return signature by `expire` as number', () => {
    const signature = generateSecureSignature(FIXTURE_SECRET, {
      expire: Date.now() + FIXTURE_LIFETIME
    })
    expect(signature).toBe(EXPECTED_SIGNATURE)
  })

  it('should return signature by `expire` as Date', () => {
    const signature = generateSecureSignature(FIXTURE_SECRET, {
      expire: new Date(Date.now() + FIXTURE_LIFETIME)
    })
    expect(signature).toBe(EXPECTED_SIGNATURE)
  })

  it('should return signature by `lifetime`', () => {
    const signature = generateSecureSignature(FIXTURE_SECRET, {
      lifetime: FIXTURE_LIFETIME
    })
    expect(signature).toBe(EXPECTED_SIGNATURE)
  })
})
