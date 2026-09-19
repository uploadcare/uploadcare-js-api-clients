import { apiError } from '../../core/responses.js'
import { route } from '../../core/router.js'
import {
  fileInfo,
  nextUuid,
  sessionOf,
  type Session,
  type StoredFile
} from '../../state/store.js'
import { GROUP_FILES_NOT_FOUND_KEY } from './scenarios.js'

/**
 * `upload-client` sends a member per repeated `files[]` (`buildFormData`'s
 * array handling); file-uploader's fake sends one per indexed `files[0]`,
 * `files[1]`, … — in the query string as often as the body. `\d*` (rather than
 * `\d+`) matches both spellings with one pattern.
 */
const MEMBER_KEY = /^files\[\d*]$/

/** A bare file uuid, or a CDN url with image-processing operations tacked on. */
const MEMBER_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const parseMember = (
  raw: string
): { uuid: string; effects: string } | undefined => {
  const [uuid = '', ...rest] = raw.split('/')
  if (!MEMBER_UUID.test(uuid)) return undefined
  const path = rest.join('/')
  return { uuid, effects: path.startsWith('-/') ? path.slice(2) : '' }
}

/**
 * A stand-in for a member the emulator never actually stored. `upload-client`'s
 * `group.test.ts` ("should create group of files") and the whole of
 * `uploadFileGroup/groupFromUploaded.test.ts` group hardcoded, well-formed
 * uuids that no test ever uploads first — the old mock server never checked a
 * store at all (`data/group.ts`'s canned file, echoed back with the input uuid
 * swapped in), and those tests assert on the response shape rather than on an
 * upload happening first. The emulator answers the same way rather than
 * breaking a suite of passing tests over a file it was never told about.
 */
const stubFile = (uuid: string): StoredFile => ({
  uuid,
  name: uuid,
  size: 0,
  mimeType: 'application/octet-stream',
  bytes: new Uint8Array(),
  isStored: false
})

const asString = (value: FormDataEntryValue | null) =>
  typeof value === 'string' ? value : null

/**
 * A `files[N]` entry is a string on every real client — but `FormData` lets one
 * be a `File` too. That must still 400 the whole request as an invalid member
 * (matching what a malformed string already does below), not vanish from it:
 * silently dropping it would hand back a group smaller than the one asked for,
 * which looks fine and is wrong. `String(value)` would trip `no-base-to-string`
 * for no benefit — the literal below is exactly the `[object File]` `String()`
 * would have produced anyway.
 */
const memberToken = (value: FormDataEntryValue) =>
  typeof value === 'string' ? value : '[object File]'

/**
 * `/group/` and `/group/info/` answer with the same shape, built fresh each
 * time.
 */
const groupEnvelope = (session: Session, id: string, members: string[]) => ({
  id,
  datetime_created: new Date(0).toISOString(),
  datetime_stored: null,
  files_count: members.length,
  cdn_url: `https://ucarecdn.com/${id}/`,
  url: `https://api.uploadcare.com/groups/${id}/`,
  files: members.map((raw) => {
    // Every member was already validated at creation time (`parseMember`
    // below), so this can't fail — a group's membership never changes once
    // created (see the spec's "Groups are immutable" note).
    const parsed = parseMember(raw)
    if (!parsed) throw new Error(`unreachable: invalid group member ${raw}`)
    const { uuid, effects } = parsed
    return {
      ...fileInfo(session.files.get(uuid) ?? stubFile(uuid)),
      default_effects: effects
    }
  })
})

route(
  'POST',
  '/group/',
  async ({ request }) => {
    const session = sessionOf(request)
    const form = await request.formData().catch(() => new FormData())
    const query = new URL(request.url).searchParams

    // Only for the GROUP_FILES_NOT_FOUND_KEY scenario check below — the
    // public-key gate itself is the router's (`{ protected: { source: 'both'
    // } }`).
    const publicKey = asString(form.get('pub_key')) ?? query.get('pub_key')

    const members = [...form.entries(), ...query.entries()]
      .filter(([key]) => MEMBER_KEY.test(key))
      .map(([, value]) => memberToken(value))

    if (members.length === 0)
      // schema: groupFileURLParsingFailedError
      return apiError(request, 400, 'No files[N] parameters found.')

    for (const raw of members) {
      if (!parseMember(raw))
        // schema: groupFilesInvalidError
        return apiError(request, 400, `This is not valid file url: ${raw}.`)
    }

    if (publicKey === GROUP_FILES_NOT_FOUND_KEY)
      // schema: groupFilesNotFoundError — see scenarios.ts.
      return apiError(request, 400, 'Some files not found.')

    const id = `${nextUuid(session)}~${members.length}`
    session.groups.set(id, members)
    return Response.json(groupEnvelope(session, id, members))
  },
  { protected: { source: 'both' } }
)

route(
  'GET',
  '/group/info/',
  ({ request }) => {
    const session = sessionOf(request)
    const params = new URL(request.url).searchParams
    const id = params.get('group_id')
    if (!id)
      // schema: groupIdRequiredError
      return apiError(request, 400, 'group_id is required.')

    const members = session.groups.get(id)
    if (!members)
      // schema: groupNotFoundError
      return apiError(request, 404, 'group_id is invalid.')

    return Response.json(groupEnvelope(session, id, members))
  },
  { protected: true }
)
