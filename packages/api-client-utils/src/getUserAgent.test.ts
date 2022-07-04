import version from './version'
import { getUserAgent, CustomUserAgent } from './getUserAgent'

const TEST_LIBRARY_NAME = 'UploadcareUploadClient'
const TEST_VERSION = version

const BASE_PARAMS = {
  libraryName: TEST_LIBRARY_NAME,
  libraryVersion: TEST_VERSION
}

describe('getUserAgent', () => {
  it('should generate user agent', () => {
    expect(getUserAgent({ ...BASE_PARAMS })).toBe(
      `UploadcareUploadClient/${version} (JavaScript)`
    )
  })

  it('should generate user agent with integration', () => {
    expect(getUserAgent({ ...BASE_PARAMS, integration: 'test' })).toBe(
      `UploadcareUploadClient/${version} (JavaScript; test)`
    )
  })

  it('should generate user agent with pub-key', () => {
    expect(getUserAgent({ ...BASE_PARAMS, publicKey: 'test' })).toBe(
      `UploadcareUploadClient/${version}/test (JavaScript)`
    )
  })

  it('should generate user agent with integration and pub-key', () => {
    expect(
      getUserAgent({ ...BASE_PARAMS, publicKey: 'test', integration: 'test' })
    ).toBe(`UploadcareUploadClient/${version}/test (JavaScript; test)`)
  })

  it('should be able to pass custom user agent string', () => {
    expect(getUserAgent({ ...BASE_PARAMS, userAgent: 'test' })).toBe('test')
  })

  it('should be able to pass custom user agent function', () => {
    const userAgent: CustomUserAgent = ({
      publicKey,
      libraryName,
      libraryVersion,
      languageName,
      integration
    }) => {
      expect(publicKey).toBe('test')
      expect(libraryName).toBe('UploadcareUploadClient')
      expect(libraryVersion).toBe(version)
      expect(languageName).toBe('JavaScript')
      expect(integration).toBe('integration')
      return 'test'
    }

    expect(
      getUserAgent({
        ...BASE_PARAMS,
        publicKey: 'test',
        userAgent,
        integration: 'integration'
      })
    ).toBe('test')
  })
})
