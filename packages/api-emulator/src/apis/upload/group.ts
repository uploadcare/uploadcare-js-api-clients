import { apiError } from '../../core/responses.js'
import { route } from '../../core/router.js'
import {
  fileInfo,
  nextUuid,
  sessionOf,
  type GroupMember,
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

/**
 * A bare file uuid, or a group reference (`<uuid>~N`, matching the group-id
 * shape `nextUuid`/`groupEnvelope` mint below) — either can stand as a
 * `files[]` member.
 */
const MEMBER_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(~[1-9][0-9]*)?$/i

/**
 * A `files[]` member may be a full CDN url (`https://ucarecdn.com/<uuid>/…`) —
 * the file-uploader builds groups from `cdnUrl` values, not bare uuids. Strip
 * the scheme and host so what's left parses exactly like the bare/`-/`-effects
 * forms below, whether or not the url carries a trailing slash.
 */
const CDN_URL_PREFIX = /^https?:\/\/[^/]+\//i

const parseMember = (raw: string): GroupMember | undefined => {
  const path = raw.replace(CDN_URL_PREFIX, '')
  const [uuid = '', ...rest] = path.split('/')
  if (!MEMBER_UUID.test(uuid)) return undefined
  const tail = rest.join('/')
  return { uuid, effects: tail.startsWith('-/') ? tail.slice(2) : '' }
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
const groupEnvelope = (
  session: Session,
  id: string,
  members: GroupMember[]
) => ({
  id,
  datetime_created: new Date(0).toISOString(),
  datetime_stored: null,
  files_count: members.length,
  cdn_url: `https://ucarecdn.com/${id}/`,
  url: `https://api.uploadcare.com/groups/${id}/`,
  files: members.map(({ uuid, effects }) => ({
    ...fileInfo(session.files.get(uuid) ?? stubFile(uuid)),
    default_effects: effects
  }))
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

    const tokens = [...form.entries(), ...query.entries()]
      .filter(([key]) => MEMBER_KEY.test(key))
      .map(([, value]) => memberToken(value))

    if (tokens.length === 0)
      // schema: groupFileURLParsingFailedError
      return apiError(request, 400, 'No files[N] parameters found.')

    const members: GroupMember[] = []
    for (const raw of tokens) {
      const parsed = parseMember(raw)
      if (!parsed)
        // schema: groupFilesInvalidError
        return apiError(request, 400, `This is not valid file url: ${raw}.`)
      members.push(parsed)
    }
    const anyMemberMissing = members.some(
      ({ uuid }) => !session.files.has(uuid)
    )

    // GROUP_FILES_NOT_FOUND_KEY only fakes "not found" for members the
    // emulator was never told about (see scenarios.ts) — a genuinely
    // uploaded file must still group successfully under that key, the same
    // as it does under any other one. A blanket key-based 400 was reporting
    // real, existing uuids as missing (defect: `/info/` finds them, `/group/`
    // doesn't) purely because of which public key asked.
    if (publicKey === GROUP_FILES_NOT_FOUND_KEY && anyMemberMissing)
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
