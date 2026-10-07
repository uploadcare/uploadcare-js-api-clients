import { resetSession } from '@uploadcare/api-emulator'

/**
 * TEMPORARY: the emulator dropped its magic values for per-test presets, and
 * this suite hasn't moved to them yet. Until it does, `legacyScenarios` gives
 * the old values their old meaning on the default session, which every test
 * file here shares.
 */

export const SIGNED_UPLOADS_PUBLIC_KEY = 'pub_test__signed_uploads'

export const legacyScenarios = () => {
  const spentThrottleKeys = new Set<string>()
  resetSession()
    .use('signedUploads', { publicKey: SIGNED_UPLOADS_PUBLIC_KEY })
    .use('unknownProgress', { publicKey: 'pub_test__unknown_progress' })
    .use('hostNotFound', { sourceUrl: 'https://1.com/1.jpg' })
    .on('POST /base/', async ({ request }) => {
      const key = (await request.formData()).get('metadata[mock_throttle]')
      if (typeof key !== 'string' || spentThrottleKeys.has(key))
        return undefined
      spentThrottleKeys.add(key)
      return Response.json(
        {
          error: {
            status_code: 429,
            content: 'Request was throttled.',
            error_code: 'RequestThrottledError'
          }
        },
        { headers: { 'retry-after': '1' } }
      )
    })
}
