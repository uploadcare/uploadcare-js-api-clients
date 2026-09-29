const PORT = 3000

const ALLOWED_PUBLIC_KEYS = [
  'demopublickey',
  'secret_public_key',
  'pub_test__no_storing',
  'pub_test__unknown_progress',
  'pub_test__signed_uploads'
]

/**
 * The stand-in for a project with Signed Uploads switched on: every request
 * under this key must carry a credential, exactly as the real project the
 * integration tests use does. The secret is the one the mock verifies tokens
 * with, so a test can mint a real token for it.
 */
const SIGNED_UPLOADS_PUBLIC_KEY = 'pub_test__signed_uploads'
const SIGNED_UPLOADS_SECRET_KEY = 'mock_secret_key'

export {
  PORT,
  ALLOWED_PUBLIC_KEYS,
  SIGNED_UPLOADS_PUBLIC_KEY,
  SIGNED_UPLOADS_SECRET_KEY
}
