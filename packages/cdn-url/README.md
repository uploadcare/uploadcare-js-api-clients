# @uploadcare/cdn-url

Build and parse [Uploadcare CDN](https://uploadcare.com/docs/delivery/cdn/) URLs:
image transformations, file groups, delivery proxy and video/document
conversion paths. Fully typed, atomic and tree-shakeable — import only what you
use.

**[Documentation](https://uploadcare.github.io/uploadcare-js-api-clients/cdn-url/)** — guides, how-to articles and the full API reference.

```sh
npm install @uploadcare/cdn-url
# or
pnpm add @uploadcare/cdn-url
yarn add @uploadcare/cdn-url
bun add @uploadcare/cdn-url
deno add npm:@uploadcare/cdn-url
```

## Parse and edit existing URLs

```ts
import { parseCdnUrl, serializeCdnUrl } from '@uploadcare/cdn-url'
import { stripMeta } from '@uploadcare/cdn-url/ops'

const parsed = parseCdnUrl(
  'https://ucarecdn.com/c2499162-eb07-4b93-b31e-94a89a47e858/-/resize/300x/photo.jpg'
)
// {
//   kind: 'file',
//   origin: 'https://ucarecdn.com',
//   uuid: 'c2499162-eb07-4b93-b31e-94a89a47e858',
//   operations: [{ name: 'resize', params: ['300x'] }],
//   filename: 'photo.jpg',
//   ...
// }

const url = serializeCdnUrl({
  ...parsed,
  operations: [...parsed.operations, stripMeta('sensitive')]
})
```

The parser is **lenient**: unknown directives (including internal `@`-prefixed
ones) are preserved verbatim, so `serializeCdnUrl(parseCdnUrl(url)) === url`.

All domain flavors are supported: legacy `ucarecdn.com`, project-prefixed
`*.ucarecd.net`, custom CNAMEs and `*.ucr.io` proxy endpoints.

```ts
import { detectDomainKind } from '@uploadcare/cdn-url'

detectDomainKind('https://1zlmtnsbgr.ucarecd.net') // 'prefixed'
detectDomainKind('https://cdn.example.com') // 'custom'
```

## Build URLs with typed operations

Operation creators validate parameters eagerly (ranges, enums, grammar) and
throw `TypeError`/`RangeError` with helpful messages:

```ts
import { serializeCdnUrl } from '@uploadcare/cdn-url'
import { preview, quality, scaleCrop, stripMeta } from '@uploadcare/cdn-url/ops'

serializeCdnUrl({
  origin: 'https://ucarecdn.com',
  uuid: 'c2499162-eb07-4b93-b31e-94a89a47e858',
  operations: [scaleCrop(1252, 670, { type: 'smart' }), stripMeta('sensitive')]
})
// https://ucarecdn.com/c2499162-…/-/scale_crop/1252x670/smart/-/strip_meta/sensitive/
// format/auto + adaptive quality are applied by the CDN automatically

preview(1000, 400) // { name: 'preview', params: ['1000x400'] }
quality('ultra') // RangeError: quality must be one of normal, better, best, …
```

Need an operation the library doesn't know yet? Use the escape hatch:

```ts
import { rawOp } from '@uploadcare/cdn-url/ops'

rawOp('@clib', 'my-lib', '1.0.0')
```

## Builder facade

An optional immutable wrapper when chaining reads better than spreading:

```ts
import { CdnUrl } from '@uploadcare/cdn-url/builder'
import { preview, quality } from '@uploadcare/cdn-url/ops'

CdnUrl.parse('https://ucarecdn.com/c2499162-…/-/resize/300x/')
  .without(resize)
  .with(preview(800, 600), stripMeta('sensitive'))
  .setFilename('hero.jpg').href
```

## The fluent mega-object

Everything behind one import, chainable end to end — for code that prefers
convenience over tree-shaking (~14 kB minified):

```ts
import { cdn } from '@uploadcare/cdn-url/fluent'

cdn.file(uuid).scaleCrop(96, 96, { type: 'smart' }).borderRadius('50p').href
cdn.video(uuid).size({ width: 720, height: 540 }).thumbs(5).path
cdn.configure({ origin: 'https://cdn.example.com' }).file(uuid).preview().href
```

Works without a bundler too, via the IIFE global build
(`dist/cdn-url.global.js` → `window.UCCdnUrl`).

## Validation of operation chains

Cross-operation rules the CDN enforces — core operation requirement,
must-be-last operations, duplicate (last-wins) directives, `stretch` binding,
dimension ceilings (3000px, 5000px with `format/jpeg`) — are surfaced as
diagnostics:

```ts
import { validateOperations } from '@uploadcare/cdn-url/validate'

validateOperations([
  { name: 'main_colors', params: [] },
  { name: 'preview', params: [] }
])
// [{ severity: 'error', code: 'must-be-last', opIndex: 0, … }]
```

## Groups

```ts
import {
  archiveUrl,
  groupUrl,
  nthUrl,
  parseGroupId
} from '@uploadcare/cdn-url/group'

const group = parseGroupId('c2499162-eb07-4b93-b31e-94a89a47e858~3')
groupUrl('https://ucarecdn.com', group) // https://ucarecdn.com/c2499162-…~3/
nthUrl('https://ucarecdn.com', group, 1, [{ name: 'resize', params: ['256x'] }])
archiveUrl('https://ucarecdn.com', group, 'zip', 'all.zip')
```

## Delivery proxy

```ts
import { defaultProxyEndpoint, proxyUrl } from '@uploadcare/cdn-url/proxy'
import { preview, resize } from '@uploadcare/cdn-url/ops'

proxyUrl(
  defaultProxyEndpoint('YOUR_PUBLIC_KEY'),
  'https://example.com/image.jpg',
  [preview(), resize({ width: 500 })]
)
// https://YOUR_PUBLIC_KEY.ucr.io/-/preview/-/resize/500x/https://example.com/image.jpg
```

## Video and document conversion paths

Video and document conversions are **paths, not URLs** — `/:uuid/video/-/.../`
strings submitted to the REST convert API (`POST /convert/video/` and
`POST /convert/document/`):

```ts
import { size, thumbs, videoPath } from '@uploadcare/cdn-url/video'
import {
  documentPath,
  format as docFormat,
  page
} from '@uploadcare/cdn-url/document'

videoPath(uuid, [size({ width: 720, height: 540 }), thumbs(5)])
// /:uuid/video/-/size/720x540/-/thumbs~5/

documentPath(uuid, [docFormat('jpg'), page(2)])
// /:uuid/document/-/format/jpg/-/page/2/
```

`gif2video`, by contrast, is an on-the-fly CDN operation and is addressed by
URL (note: no `-/` between the uuid and the prefix — the library knows this):

```ts
import {
  gif2videoUrl,
  format as gifFormat
} from '@uploadcare/cdn-url/gif2video'

gif2videoUrl('https://ucarecdn.com', uuid, [gifFormat('webm')])
// https://ucarecdn.com/:uuid/gif2video/-/format/webm/
```

The lenient URL parser still understands `/:uuid/video/...` inside full URLs,
since conversion job results are addressable on the CDN that way.

Video-specific grammar is validated too: `size` dimensions must be divisible
by 4, `cut` accepts `HHH:MM:SS.sss` or seconds with the `end` keyword, `thumbs`
takes 1–50.

## Development and production bundles

The package ships two bundle flavors from the same source, selected via the
`development` / `production` [export conditions](https://nodejs.org/api/packages.html#community-conditions-definitions):

- **development** — eager validation in operation creators, runtime checks and
  descriptive `TypeError`/`RangeError` messages. Picked automatically by Vite,
  webpack and other bundlers in dev mode (and by Node with
  `--conditions=development`).
- **production** (default) — minified, with all runtime checks stripped by dead
  code elimination. Invalid input is serialized as-is (garbage in, garbage
  out), so catch mistakes in development.

Structural errors that callers rely on (e.g. `parseCdnUrl` throwing on a
non-CDN URL, `parseGroupId` on a malformed id) are kept in **both** flavors,
and the explicit `@uploadcare/cdn-url/validate` module is always fully
functional — it is an opt-in API, not a runtime check.

## Supported environments

No DOM, no Node-specific APIs, zero dependencies — runs in Node.js **≥ 16**,
evergreen browsers (Chrome/Edge 87+, Firefox 78+, Safari 14+), Bun, Deno, edge
runtimes, and React Native (with a spec-compliant `URL` polyfill). The only
platform features required are `URL` and `String.prototype.replaceAll`. The
test suite runs in Node and real Chromium; every build is smoke-tested through
both module systems.

## Useful links

- [Package documentation](https://uploadcare.github.io/uploadcare-js-api-clients/cdn-url/) — guides, how-tos, API reference
- [Image transformations](https://uploadcare.com/docs/transformations/image/)
- [CDN operations reference](https://uploadcare.com/docs/cdn-operations/)
- [Delivery proxy](https://uploadcare.com/docs/delivery/proxy/)
- [File groups](https://uploadcare.com/docs/file-groups/)
- [Video encoding](https://uploadcare.com/docs/transformations/video-encoding/)
