import { generateSecureSignature } from './generateSecureSignature'
import { jest, expect } from '@jest/globals'

const FIXTURE_SECRET = 'YOUR_SECRET_KEY'
const FIXTURE_DATE = new Date(1678359840000)
const FIXTURE_LIFETIME = 60 * 30 * 1000 // 30 minutes
const EXPECTED_SIGNATURE =
  '93b69d086a487fbdfc36172b96a5d7f5afa7cb209e43e5f25890bc037e638584'

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

  it('should return signature by `lifetime`', () => {
    const signature = generateSecureSignature(FIXTURE_SECRET, {
      lifetime: FIXTURE_LIFETIME
    })
    expect(signature).toBe(EXPECTED_SIGNATURE)
  })
})
