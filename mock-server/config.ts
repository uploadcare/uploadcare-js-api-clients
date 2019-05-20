const PORT = 3000
const ALLOWED_PUBLIC_KEYS = [
  'demopublickey',
  '657ec3b474e01b9045f7',
]
const PROTECTED_ROUTES = [
  'base',
  'info',
  'from_url',
  'from_url/status',
]

export {
  PORT,
  ALLOWED_PUBLIC_KEYS,
  PROTECTED_ROUTES,
}
