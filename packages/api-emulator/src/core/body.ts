export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/**
 * A request body's string fields, read from a _clone_ — the handler still needs
 * to read the real body itself afterwards, and a `Request`'s body can only be
 * consumed once. Empty for a body that is neither.
 *
 * Form bodies as-is (the first value of a repeated field). A JSON object body —
 * the derivative endpoints' shape — is flattened one level, so `metadata: {
 * mock_throttle: 'x' }` is `metadata[mock_throttle]`, the name the same field
 * has in a form and the one `THROTTLE_ONCE_FIELD` spells.
 */
export const bodyFields = async (
  request: Request
): Promise<Map<string, string>> => {
  const fields = new Map<string, string>()
  const clone = request.clone()
  if (request.headers.get('content-type')?.includes('application/json')) {
    const body: unknown = await clone.json().catch(() => undefined)
    if (!isRecord(body)) return fields
    for (const [name, value] of Object.entries(body)) {
      if (typeof value === 'string') fields.set(name, value)
      else if (isRecord(value))
        for (const [key, inner] of Object.entries(value))
          if (typeof inner === 'string') fields.set(`${name}[${key}]`, inner)
    }
    return fields
  }
  const form = await clone.formData().catch(() => undefined)
  form?.forEach((value, name) => {
    if (typeof value === 'string' && !fields.has(name)) fields.set(name, value)
  })
  return fields
}
