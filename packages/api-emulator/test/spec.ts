/**
 * Validates emulator responses against Uploadcare's published API OpenAPI
 * documents (`specs/<name>.json`, vendored by `spec:refresh` — see
 * `../scripts/spec-refresh.ts`). This is the contract from Task 2.5 on: the
 * document is the authority for every response shape this package produces.
 *
 * Two things it deliberately does not do, because the document itself doesn't
 * model them:
 *
 * - `jsonerrors=1`. upload-client sends it on every request, which makes the real
 *   API (and this emulator) answer errors as a JSON envelope instead of the
 *   `text/plain` sentence the spec documents. Without it, the plain sentence is
 *   validated structurally against the spec's schema for that status. With it,
 *   the envelope shape itself isn't checked — the spec doesn't describe it —
 *   but its `error.content` is checked against the same sentences the spec
 *   declares (`default` values on the `*Error` schemas the status's
 *   `text/plain` schema anyOf's together).
 * - OpenAPI 3.0 isn't JSON Schema. `nullable: true` becomes a `null` type union,
 *   and `example`/`examples`/`discriminator` are dropped. Ajv runs with
 *   `strict: false`.
 */
import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import uploadApiSpec from './specs/upload-api.json'

/** The specs `assertMatchesSpec` can select by name — `upload-api` today. */
const specs = { 'upload-api': uploadApiSpec } as const
export type SpecName = keyof typeof specs

type JsonObject = Record<string, unknown>

const isObject = (value: unknown): value is JsonObject =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/**
 * Converts one OpenAPI 3.0 schema node to JSON Schema: `nullable: true` becomes
 * a `null` type union, and the annotation-only keywords Ajv would otherwise
 * just ignore are dropped for clarity. Applied to the whole document once, up
 * front, so every `$ref` inside it resolves to an already-converted node.
 *
 * Deliberately does not handle other OpenAPI-3.0-vs-JSON-Schema divergences
 * this document doesn't happen to use: draft-04-style boolean
 * `exclusiveMinimum`/`exclusiveMaximum` (JSON Schema draft-07+, which Ajv 8
 * expects, wants a number instead), `readOnly`/`writeOnly` direction filtering,
 * and OpenAPI's separate top-level `components.examples` (as opposed to the
 * inline `example`/`examples` keywords this function does strip). If a future
 * spec refresh introduces any of these, expect a confusing Ajv failure rather
 * than a silent one — extend this function rather than the callers.
 */
const toJsonSchema = (node: unknown): unknown => {
  if (Array.isArray(node)) return node.map(toJsonSchema)
  if (!isObject(node)) return node

  const output: JsonObject = {}
  for (const [key, value] of Object.entries(node)) {
    if (key === 'example' || key === 'examples' || key === 'discriminator')
      continue
    output[key] = toJsonSchema(value)
  }

  if (output.nullable !== true) return output
  delete output.nullable

  if (Array.isArray(output.type)) {
    if (!output.type.includes('null')) output.type = [...output.type, 'null']
    return output
  }
  if (typeof output.type === 'string') {
    output.type = [output.type, 'null']
    return output
  }
  // No own `type` to widen (schema is a `$ref`, `enum`, `anyOf`, …): add an
  // explicit null branch alongside it instead.
  return { anyOf: [output, { type: 'null' }] }
}

const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)
for (const [name, document] of Object.entries(specs)) {
  ajv.addSchema(toJsonSchema(document) as JsonObject, name)
}

/** Reads `doc[a][b][c]…`, returning `undefined` for any missing step. */
const get = (doc: unknown, segments: readonly string[]): unknown =>
  segments.reduce<unknown>(
    (node, segment) => (isObject(node) ? node[segment] : undefined),
    doc
  )

const escapePointerSegment = (segment: string) =>
  segment.replace(/~/g, '~0').replace(/\//g, '~1')

const toJsonPointer = (segments: readonly string[]) =>
  `/${segments.map(escapePointerSegment).join('/')}`

const decodePointerSegment = (segment: string) =>
  segment.replace(/~1/g, '/').replace(/~0/g, '~')

/** Follows a `$ref: '#/…'` (the document has no external refs) to its target. */
const resolveRef = (doc: unknown, node: unknown): unknown => {
  if (!isObject(node) || typeof node.$ref !== 'string') return node
  const segments = node.$ref
    .replace(/^#\//, '')
    .split('/')
    .map(decodePointerSegment)
  return resolveRef(doc, get(doc, segments))
}

/**
 * Steps from an already-known-to-exist `pointer` through `segments`, following
 * any `$ref` found along the way _before_ taking the next step. Every response
 * object in this spec — and several of its schemas — is a `$ref` into
 * `components.*` rather than an inline object, so a plain property walk (`get`)
 * falls through to `undefined` the moment it meets one: it doesn't fail loudly,
 * it just stops finding anything, which is exactly the silent-pass shape a
 * vacuous validator would take. Returns the value alongside the pointer it
 * actually ended up at, since that's a real location in `doc` (unlike the
 * pointer we started descending from), which a caller can still hand to Ajv for
 * it to resolve further nested `$ref`s (e.g. `fileUploadInfo` → `imageInfo`)
 * against the whole document.
 */
const descend = (
  doc: unknown,
  pointer: readonly string[],
  segments: readonly string[]
): { value: unknown; pointer: string[] } => {
  let trail = [...pointer]
  let node = get(doc, trail)
  for (const segment of segments) {
    while (isObject(node) && typeof node.$ref === 'string') {
      trail = node.$ref.replace(/^#\//, '').split('/').map(decodePointerSegment)
      node = get(doc, trail)
    }
    if (!isObject(node))
      return { value: undefined, pointer: [...trail, segment] }
    trail = [...trail, segment]
    node = node[segment]
  }
  return { value: node, pointer: trail }
}

/**
 * Every `default` string reachable from a schema through
 * `$ref`/`anyOf`/`oneOf`.
 */
const collectDefaults = (doc: unknown, schema: unknown): string[] => {
  const resolved = resolveRef(doc, schema)
  if (!isObject(resolved)) return []
  if (typeof resolved.default === 'string') return [resolved.default]
  const anyOf = Array.isArray(resolved.anyOf) ? resolved.anyOf : []
  const oneOf = Array.isArray(resolved.oneOf) ? resolved.oneOf : []
  return [...anyOf, ...oneOf].flatMap((branch) => collectDefaults(doc, branch))
}

const validators = new Map<string, ValidateFunction>()

const validatorAt = (name: SpecName, pointer: string): ValidateFunction => {
  const key = `${name}${pointer}`
  const cached = validators.get(key)
  if (cached) return cached
  const validate = ajv.compile({ $ref: `${name}#${pointer}` })
  validators.set(key, validate)
  return validate
}

class SpecMismatchError extends Error {}

const fail = (message: string): never => {
  throw new SpecMismatchError(message)
}

const describe = (method: string, path: string, status: number) =>
  `${method.toUpperCase()} ${path} → ${status}`

const validateAgainst = (
  name: SpecName,
  pointer: string,
  body: unknown,
  method: string,
  path: string,
  status: number
) => {
  const validate = validatorAt(name, pointer)
  if (validate(body)) return
  const detail = (validate.errors ?? [])
    .map(
      (error: ErrorObject) => `${error.instancePath || '/'} ${error.message}`
    )
    .join('; ')
  fail(
    `${describe(method, path, status)}: response does not match the spec — ${detail}`
  )
}

export const assertMatchesSpec = async (args: {
  method: string
  path: string
  status: number
  response: Response
  body: unknown
  /** Which spec to validate against — `test/specs/<spec>.json`. */
  spec?: SpecName
}): Promise<void> => {
  const method = args.method.toLowerCase()
  const { path, status, response, body } = args
  const name = args.spec ?? 'upload-api'
  const specDocument = specs[name]

  const operation = get(specDocument, ['paths', path, method])
  if (!isObject(operation)) {
    fail(`the spec has no ${method.toUpperCase()} ${path} operation`)
    return
  }

  const statusKey = String(status)
  const responses = isObject(operation.responses) ? operation.responses : {}
  if (!(statusKey in responses)) {
    const documented = Object.keys(responses)
    fail(
      `${describe(method, path, status)}: not a status the spec documents for this operation ` +
        `(documented: ${documented.join(', ') || 'none'})`
    )
  }

  const responseBase = ['paths', path, method, 'responses', statusKey]

  if (status >= 200 && status < 300) {
    const { value: schema, pointer } = descend(specDocument, responseBase, [
      'content',
      'application/json',
      'schema'
    ])
    if (schema === undefined) return
    validateAgainst(name, toJsonPointer(pointer), body, method, path, status)
    return
  }

  const { value: plainSchema, pointer: plainPointer } = descend(
    specDocument,
    responseBase,
    ['content', 'text/plain', 'schema']
  )
  if (plainSchema === undefined) return

  const contentType = response.headers
    .get('content-type')
    ?.split(';')[0]
    ?.trim()

  if (contentType === 'application/json') {
    // `jsonerrors=1`: the spec doesn't model this envelope, only the sentence
    // it carries — checked against the same `default`s the plain-text path
    // would be validated against.
    const content =
      isObject(body) && isObject(body.error) ? body.error.content : undefined
    if (typeof content !== 'string') {
      fail(
        `${describe(method, path, status)}: jsonerrors envelope has no string error.content`
      )
      return
    }
    const allowed = collectDefaults(specDocument, plainSchema)
    if (allowed.length > 0 && !allowed.includes(content)) {
      fail(
        `${describe(method, path, status)}: error.content ${JSON.stringify(content)} is not one of ` +
          `the sentences the spec declares (${allowed.map((sentence) => JSON.stringify(sentence)).join(', ')})`
      )
    }
    return
  }

  validateAgainst(name, toJsonPointer(plainPointer), body, method, path, status)
}
