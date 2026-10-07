/**
 * Validates emulator responses against Uploadcare's published API OpenAPI
 * documents (`specs/<name>.json`, vendored by `spec:refresh` — see
 * `../scripts/spec-refresh.ts`). The document is the authority for every
 * response shape this package produces.
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
import { expect } from 'vitest'
import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import uploadApiSpec from './specs/upload-api.json'

/**
 * `groupInfo.files[].default_effects` is declared `format: uri`, but that's
 * simply wrong: neither the spec's own example for it (`"resize/x800/"`) nor
 * the real API's actual value for a file with no operations applied (an empty
 * string) is a URI by that format's own rules (no scheme — ajv-formats rejects
 * both). Patched out in place, before either `toJsonSchema` (below) compiles it
 * into the registered ajv schema, or `descend`/`collectDefaults` (further down)
 * walk this same object for `$ref` pointers — both need the one, single
 * document this file loads.
 */
delete (
  uploadApiSpec.components.schemas.groupInfo.properties.files.allOf[0]
    ?.properties as { default_effects?: { format?: string } } | undefined
)?.default_effects?.format

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
 *
 * One more, e.g. `groupInfo.files`: `type: array` with an
 * `allOf`/`oneOf`/`anyOf` as a _sibling_ of `type`, rather than nested under
 * `items` — the document just omits the `items` wrapper. Taken literally, that
 * requires the array itself (not its elements) to also satisfy those branches,
 * which no array ever can. Moving the sibling into `items` is the only reading
 * that makes the schema satisfiable at all, and matches what the spec's prose
 * plainly means ("an array … may contain null values").
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

  if (output.type === 'array' && !('items' in output)) {
    const items: JsonObject = {}
    for (const key of ['allOf', 'oneOf', 'anyOf'] as const) {
      if (key in output) {
        items[key] = output[key]
        delete output[key]
      }
    }
    if (Object.keys(items).length > 0) output.items = items
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
const SPEC = 'upload-api'
ajv.addSchema(toJsonSchema(uploadApiSpec) as JsonObject, SPEC)

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

class SpecMismatchError extends Error {}

function fail(message: string): never {
  throw new SpecMismatchError(message)
}

const validators = new Map<string, ValidateFunction>()

/**
 * Pointers in the published document whose schema accepts `{}` — every property
 * optional, no `required`, no `additionalProperties: false`. A validator
 * compiled from one of these asserts _nothing_: `assertMatchesSpec` against
 * such a response passes for any object at all, including one with every
 * documented field deleted.
 *
 * They are listed here by name, rather than left to look like coverage, because
 * the fix is not in this file: a route whose 200 lands on one of these needs
 * direct assertions in its own test (see the `cdn_url`/`url`/`datetime_*`
 * assertions in `test/group.test.ts`, which exist for exactly this reason).
 *
 * `validatorAt` checks the list both ways, so it can't rot: a pointer here that
 * starts rejecting `{}` after a `spec:refresh` fails just as loudly as one that
 * starts accepting it without being listed.
 */
const VACUOUS_SCHEMAS = new Set<string>([
  // `baseUploadSuccessful` — an object with no `required` and no
  // `additionalProperties: false`. Covered directly by `test/base.test.ts`
  // ("hands back a new id for every upload") and `test/spec.test.ts`.
  'upload-api/components/responses/baseUploadSuccessful/content/application~1json/schema',
  // `groupInfo`, reached by both `/group/`'s and `/group/info/`'s 200 — no
  // `required` at all. `test/group.test.ts` asserts `id`, `files_count`,
  // `cdn_url`, `url`, `datetime_created`, `datetime_stored` and `files[]`
  // itself, because nothing here does.
  'upload-api/components/responses/createFilesGroupSuccessful/content/application~1json/schema',
  'upload-api/components/responses/filesGroupInfoSuccessful/content/application~1json/schema',
  // `/from_url/`'s 200 — a `oneOf` of the token and file-info shapes, neither
  // of which forbids extra properties. `test/from-url.test.ts` asserts `type`
  // and `token`/`original_filename` directly.
  'upload-api/components/responses/fromURLUploadResponseSuccessful/content/application~1json/schema',
  // `/from_url/status/`'s 200 — an `anyOf` whose branches include ones with no
  // `required`, so every object satisfies one. `test/from-url.test.ts` asserts
  // `status`, `total`/`done` and `original_filename` directly.
  'upload-api/components/responses/fromURLUploadStatusSuccessful/content/application~1json/schema'
])

/**
 * Operations the emulator serves that the published document doesn't describe
 * at all, so `assertMatchesSpec` has nothing to validate them against. Listed
 * by name, like `VACUOUS_SCHEMAS`, rather than left to fail as an unknown
 * operation: these were modelled on the client that calls them instead, and
 * their own test file asserts every field directly.
 *
 * The derivative endpoints are ai-image-editor's (`UploadcareApiClient` and its
 * dev-only Zod schemas); `test/derivative.test.ts` checks the shapes that
 * client sends and reads. `test/spec.test.ts` fails once the document gains
 * one, so the entry gets dropped and the route validated for real.
 */
export const UNSPECIFIED_OPERATIONS = new Set<string>([
  'POST /derivative/image/generate/',
  'POST /derivative/image/edit/',
  'GET /derivative/status/'
])

const assertNotVacuous = (key: string, validate: ValidateFunction) => {
  const acceptsEmpty = validate({})
  const listed = VACUOUS_SCHEMAS.has(key)
  if (acceptsEmpty && !listed)
    fail(
      `${key} accepts {} — it asserts nothing. Either the schema gained a ` +
        `\`required\`, or this pointer belongs in VACUOUS_SCHEMAS with a test ` +
        `that checks the fields directly.`
    )
  if (!acceptsEmpty && listed)
    fail(
      `${key} no longer accepts {} — it is a real assertion now, so drop it ` +
        `from VACUOUS_SCHEMAS.`
    )
}

const validatorAt = (pointer: string): ValidateFunction => {
  const key = `${SPEC}${pointer}`
  const cached = validators.get(key)
  if (cached) return cached
  const validate = ajv.compile({ $ref: `${SPEC}#${pointer}` })
  assertNotVacuous(key, validate)
  validators.set(key, validate)
  return validate
}

const describe = (method: string, path: string, status: number) =>
  `${method.toUpperCase()} ${path} → ${status}`

const validateAgainst = (
  pointer: string,
  body: unknown,
  method: string,
  path: string,
  status: number
) => {
  const validate = validatorAt(pointer)
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

const contentTypeOf = (response: Response) =>
  response.headers.get('content-type')?.split(';')[0]?.trim()

/**
 * Validates `response` against the spec's `method path` operation. The status
 * it validates is the `jsonerrors` envelope's `error.status_code` when the body
 * is one (the HTTP status is then 200), and `response.status` otherwise.
 * `bodyOverride` replaces the response's own body, for the tests that check a
 * doctored body is rejected.
 */
export const assertMatchesSpec = async (
  response: Response,
  operation: { method: string; path: string },
  bodyOverride?: unknown
): Promise<void> => {
  const method = operation.method.toLowerCase()
  const { path } = operation
  const isJson = contentTypeOf(response) === 'application/json'
  const body =
    bodyOverride ??
    (await (isJson ? response.clone().json() : response.clone().text()))
  const envelope =
    isJson && isObject(body) && isObject(body.error) ? body.error : undefined
  const status =
    typeof envelope?.status_code === 'number'
      ? envelope.status_code
      : response.status

  if (UNSPECIFIED_OPERATIONS.has(`${method.toUpperCase()} ${path}`))
    fail(
      `${method.toUpperCase()} ${path} is in UNSPECIFIED_OPERATIONS: the spec ` +
        `doesn't describe it, so assert the body directly instead`
    )

  const specOperation = get(uploadApiSpec, ['paths', path, method])
  if (!isObject(specOperation))
    fail(`the spec has no ${method.toUpperCase()} ${path} operation`)

  const statusKey = String(status)
  const responses = isObject(specOperation.responses)
    ? specOperation.responses
    : {}
  if (!(statusKey in responses)) {
    const documented = Object.keys(responses)
    fail(
      `${describe(method, path, status)}: not a status the spec documents for this operation ` +
        `(documented: ${documented.join(', ') || 'none'})`
    )
  }

  const responseBase = ['paths', path, method, 'responses', statusKey]

  if (status >= 200 && status < 300) {
    const { value: schema, pointer } = descend(uploadApiSpec, responseBase, [
      'content',
      'application/json',
      'schema'
    ])
    // Not a silent pass: an operation the document declares but gives no
    // JSON schema for (`PUT /<presigned-url-x>`'s `2XX`, which has no
    // `content` at all) validates nothing, so saying so is the only honest
    // outcome. Add the case to the document, or assert the body directly.
    if (schema === undefined)
      fail(
        `${describe(method, path, status)}: the spec declares this response but no ` +
          `application/json schema for it, so there is nothing to validate against`
      )
    validateAgainst(toJsonPointer(pointer), body, method, path, status)
    return
  }

  const { value: plainSchema, pointer: plainPointer } = descend(
    uploadApiSpec,
    responseBase,
    ['content', 'text/plain', 'schema']
  )
  // Same reasoning as the 2xx branch above.
  if (plainSchema === undefined)
    fail(
      `${describe(method, path, status)}: the spec declares this response but no ` +
        `text/plain schema for it, so there is nothing to validate against`
    )

  if (isJson) {
    // `jsonerrors=1`: the spec doesn't model this envelope, only the sentence
    // it carries — checked against the same `default`s the plain-text path
    // would be validated against.
    const content = envelope?.content
    if (typeof content !== 'string')
      fail(
        `${describe(method, path, status)}: jsonerrors envelope has no string error.content`
      )
    const allowed = collectDefaults(uploadApiSpec, plainSchema)
    if (allowed.length > 0 && !allowed.includes(content))
      fail(
        `${describe(method, path, status)}: error.content ${JSON.stringify(content)} is not one of ` +
          `the sentences the spec declares (${allowed.map((sentence) => JSON.stringify(sentence)).join(', ')})`
      )
    return
  }

  validateAgainst(toJsonPointer(plainPointer), body, method, path, status)
}

/**
 * `jsonerrors=1` answers **HTTP 200** and carries the real code in the envelope
 * — see `src/core/responses.ts`. Asserting `response.status` directly on such a
 * response would pin the wrong thing, so every error test goes through here.
 */
export const jsonError = async (response: Response) => {
  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toMatch(/^application\/json/)
  const body = (await response.clone().json()) as {
    error: { status_code: number; content: string; error_code?: string }
  }
  return body.error
}
