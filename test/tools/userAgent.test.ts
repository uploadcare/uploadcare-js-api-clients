// import version from '../../src/version'
import { getUserAgent } from '../../src/tools/userAgent'

describe('getUserAgent', () => {
  it('should generate user agent without params', () => {
    expect(getUserAgent()).toBe('UploadcareUploadClient/1.0.0 (JavaScript)')
  })

  it('should generate user agent with integration', () => {
    expect(getUserAgent({ integration: 'test' })).toBe(
      'UploadcareUploadClient/1.0.0 (JavaScript; test)'
    )
  })

  it('should generate user agent with pub-key', () => {
    expect(getUserAgent({ publicKey: 'test' })).toBe(
      'UploadcareUploadClient/1.0.0/test (JavaScript)'
    )
  })

  it('should generate user agent with integration and pub-key', () => {
    expect(getUserAgent({ publicKey: 'test', integration: 'test' })).toBe(
      'UploadcareUploadClient/1.0.0/test (JavaScript; test)'
    )
  })
})
