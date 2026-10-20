/**
 * An upload's `store`/`UPLOADCARE_STORE` field. `auto` (the default) leaves it
 * to project settings, and the demo project stores.
 */
export const storedBy = (value: FormDataEntryValue | null) =>
  value !== '0' && value !== 'false'

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/** A JSON object body, or `undefined` for anything else. */
export const jsonRecord = async (request: Request) => {
  const body: unknown = await request.json().catch(() => undefined)
  return isRecord(body) ? body : undefined
}

/**
 * A request body's string fields, read from a _clone_ — the handler still needs
 * to read the real body itself afterwards, and a `Request`'s body can only be
 * consumed once. A form's first value of each field, or a JSON object's
 * top-level strings (the derivative endpoints' shape); empty for anything
 * else.
 */
export const bodyFields = async (
  request: Request
): Promise<Map<string, string>> => {
  const fields = new Map<string, string>()
  const clone = request.clone()
  if (request.headers.get('content-type')?.includes('application/json')) {
    const body = await jsonRecord(clone)
    if (!body) return fields
    for (const [name, value] of Object.entries(body))
      if (typeof value === 'string') fields.set(name, value)
    return fields
  }
  const form = await clone.formData().catch(() => undefined)
  form?.forEach((value, name) => {
    if (typeof value === 'string' && !fields.has(name)) fields.set(name, value)
  })
  return fields
}
