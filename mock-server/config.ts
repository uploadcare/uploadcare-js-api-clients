import { config } from 'dotenv'

config()

const PORT = 3000

const ALLOWED_PUBLIC_KEYS = [
  'demopublickey',
  process.env.UC_KEY_FOR_INTEGRATION_TESTS,
  'pub_test__no_storing'
]

export { PORT, ALLOWED_PUBLIC_KEYS }
