# Cookbook

Task-shaped index. Find what you're trying to do, take the snippet. The other how-to pages go deep on one topic; this one goes wide across tasks.

Every recipe is shown in all three API styles. Pick a tab and stay in it. A fourth style, [the string level](/guide/string-level-api), trades the operation model for bytes; it gets one recipe of its own rather than a tab, since it only handles single-file URLs.

## Before you start

**The three styles do the same work at different prices.** Every operation creator is an independent atom and every entry point is separate, so a bundler drops whatever you don't name:

| tab            | what you import                   | gzipped |
| -------------- | --------------------------------- | ------- |
| _string level_ | `tinyParse`/`tinyBuild` + a chain | 419 B   |
| **Atomic**     | functional core + one op creator  | 1487 B  |
| **Builder**    | `CdnUrl` + one op creator         | 2041 B  |
| **Fluent**     | the `cdn` object                  | 4967 B  |

Measured on one task — parse a URL, add one operation, serialize.

Atomic is the smallest and the most explicit. Builder wraps one URL in an immutable class. Fluent puts every URL flavor behind one chainable object, and it is the only style that turns an invalid combination into a compile error: `cdn.video(uuid).blur(10)` does not typecheck, because video chains carry no image methods. [API styles & tree-shaking](/guide/functional-vs-builder) compares them properly.

**Everything is immutable.** No method mutates in place; use the return value.

**Creators double as references.** Anywhere a recipe identifies an operation you can pass its name (`'resize'`), an operation object, or the uncalled creator (`resize`). The creator form is typo-proof and resolves aliases, so `cropByRatio` refers to the `crop` directive it produces.

Every snippet below assumes these bindings:

::: code-group

```ts [Atomic]
import type { CdnOperation } from '@uploadcare/cdn-url'
import {
  operationMatches,
  parseCdnUrl,
  serializeCdnUrl
} from '@uploadcare/cdn-url'
import { blur, overlay, resize, scaleCrop } from '@uploadcare/cdn-url/ops'

const uuid = 'c2499162-eb07-4b93-b31e-94a89a47e858'
const origin = 'https://ucarecdn.com'
const stored = `${origin}/${uuid}/-/resize/300x/-/quality/smart/`

/** Rewrite a URL's operation chain and serialize it back. */
function mapOperations(
  url: string,
  fn: (operations: CdnOperation[]) => CdnOperation[]
): string {
  const parsed = parseCdnUrl(url)
  // group roots carry no operations at all
  if (!('operations' in parsed)) return url
  return serializeCdnUrl({ ...parsed, operations: fn([...parsed.operations]) })
}
```

```ts [Builder]
import { operationMatches } from '@uploadcare/cdn-url'
import { CdnUrl } from '@uploadcare/cdn-url/builder'
import { blur, overlay, resize, scaleCrop } from '@uploadcare/cdn-url/ops'

const uuid = 'c2499162-eb07-4b93-b31e-94a89a47e858'
const origin = 'https://ucarecdn.com'
const stored = `${origin}/${uuid}/-/resize/300x/-/quality/smart/`

const url = CdnUrl.parse(stored)
```

```ts [Fluent]
import { operationMatches } from '@uploadcare/cdn-url'
import { cdn } from '@uploadcare/cdn-url/fluent'
import { blur, overlay, resize } from '@uploadcare/cdn-url/ops'

const uuid = 'c2499162-eb07-4b93-b31e-94a89a47e858'
const origin = 'https://ucarecdn.com'
const stored = `${origin}/${uuid}/-/resize/300x/-/quality/smart/`

// cdn.parse returns a union, so narrow once to get a FileChain
const parsed = cdn.parse(stored)
if (parsed.kind !== 'file') throw new Error('expected a file url')
const chain = parsed
```

:::

`parseCdnUrl` and `cdn.parse` throw a `TypeError` on anything that isn't a CDN URL. Malformed strings and URLs with an empty path both fail, so wrap them when the input is a database row you don't control.

## Getting a URL out

### I want a thumbnail from a uuid

::: code-group

```ts [Atomic]
serializeCdnUrl({
  origin,
  uuid,
  operations: [scaleCrop(300, 300, { type: 'smart' })]
})
// → https://ucarecdn.com/<uuid>/-/scale_crop/300x300/smart/
```

```ts [Builder]
new CdnUrl({
  origin,
  uuid,
  operations: [scaleCrop(300, 300, { type: 'smart' })]
}).href
```

```ts [Fluent]
cdn.file(uuid).scaleCrop(300, 300, { type: 'smart' }).href
```

:::

The input is loose in all three: `origin` plus one addressing field (`uuid`, `group` or `sourceUrl`) is the minimum, and `operations`, `filename`, `conversion`, `search` and `hash` are optional. `serializeCdnUrl({ origin, uuid })` alone gives you the bare file URL.

One core operation is enough. The CDN applies `format/auto` on its own once a chain does any processing, and adaptive quality is the default for projects created on or after 2025-08-04.

### I want to swap the CDN domain

::: code-group

```ts [Atomic]
serializeCdnUrl({
  ...parseCdnUrl(stored),
  origin: 'https://1zlmtnsbgr.ucarecd.net'
})
```

```ts [Builder]
url.setOrigin('https://1zlmtnsbgr.ucarecd.net').href
```

```ts [Fluent]
chain.on('https://1zlmtnsbgr.ucarecd.net').href
```

:::

`ucarecd.net` is not a typo. It's the project-prefixed zone, distinct from the legacy `ucarecdn.com`.

### I want a download filename on the URL

::: code-group

```ts [Atomic]
const file = parseCdnUrl(stored)
if (file.kind === 'file') {
  serializeCdnUrl({ ...file, filename: 'invoice-2026.pdf' })
}
// → https://ucarecdn.com/<uuid>/-/resize/300x/-/quality/smart/invoice-2026.pdf
```

```ts [Builder]
url.setFilename('invoice-2026.pdf').href
```

```ts [Fluent]
chain.filename('invoice-2026.pdf').href
```

:::

Pass `null` to clear it. Group roots and proxy URLs cannot carry a filename at all. The builder and fluent forms throw in the development bundle and quietly do nothing in production; the atomic form makes you narrow on `kind` before you get the chance.

Note the asymmetry: what `parseCdnUrl` _returns_ is fully populated, so `filename` is `string | null` and never missing. Only the input side is optional.

### I want the original file, no operations

::: code-group

```ts [Atomic]
mapOperations(stored, () => [])
// → https://ucarecdn.com/<uuid>/
```

```ts [Builder]
url.updateOperations(() => []).href
```

```ts [Fluent]
chain.updateOperations(() => []).href
```

:::

This clears the operation chain only. A filename, a `?token=` query and a conversion prefix all survive. Clear the query explicitly:

```ts
const withToken = parseCdnUrl(`${stored}?token=abc123`)
serializeCdnUrl({ ...withToken, search: '' })
```

## Editing a chain

### I want to change one operation and keep the rest

::: code-group

```ts [Atomic]
mapOperations(stored, (ops) =>
  ops.map((op) => (operationMatches(op, resize) ? resize({ width: 500 }) : op))
)
// → https://ucarecdn.com/<uuid>/-/resize/500x/-/quality/smart/
```

```ts [Builder]
url.replace(resize({ width: 500 })).href
```

```ts [Fluent]
chain.replaceOp(resize({ width: 500 })).href
```

:::

::: warning The three forms differ here
`replace` and `replaceOp` **append** when nothing matches. If the stored URL sized its image with `scale_crop`, replacing `resize` gives you a URL carrying both operations. The atomic `map` leaves it untouched instead.

Guard the facades when the incoming chain isn't yours:

```ts
const sized = url.has(resize) ? url.replace(resize({ width: 500 })) : url
```

:::

### I want to change the second overlay, not the first

::: code-group

```ts [Atomic]
const replacement = overlay(uuid, { size: ['50p', '50p'] })

let seen = 0
mapOperations(stored, (ops) =>
  ops.map((op) =>
    operationMatches(op, overlay) && seen++ === 1 ? replacement : op
  )
)
```

```ts [Builder]
const replacement = overlay(uuid, { size: ['50p', '50p'] })

let seen = 0
url.updateOperations((ops) =>
  ops.map((op) =>
    operationMatches(op, overlay) && seen++ === 1 ? replacement : op
  )
).href
```

```ts [Fluent]
const replacement = overlay(uuid, { size: ['50p', '50p'] })

let seen = 0
chain.updateOperations((ops) =>
  ops.map((op) =>
    operationMatches(op, overlay) && seen++ === 1 ? replacement : op
  )
).href
```

:::

`seen++ === 1` picks the second match, counting from zero like an array index. `replace` and `replaceOp` only ever touch the first match. `replaceAll` and `replaceAllOps` collapse every match into one, and append when there are none.

### I want to add an operation only if it isn't there

::: code-group

```ts [Atomic]
mapOperations(stored, (ops) =>
  ops.some((op) => operationMatches(op, blur)) ? ops : [...ops, blur(10)]
)
```

```ts [Builder]
const next = url.has(blur) ? url : url.with(blur(10))
```

```ts [Fluent]
const next = chain.hasOp(blur) ? chain : chain.blur(10)
```

:::

### I want to see what's in a URL

::: code-group

```ts [Atomic]
const current = parseCdnUrl(stored)
const ops = 'operations' in current ? current.operations : []

ops.some((op) => operationMatches(op, blur)) // → false
ops.find((op) => operationMatches(op, resize)) // → { name: 'resize', params: ['300x'] }
ops.filter((op) => operationMatches(op, overlay)) // → []
```

```ts [Builder]
url.operations // the whole chain, as a copy
url.has(blur) // → false
url.get(resize) // → { name: 'resize', params: ['300x'] }
url.getAll(overlay) // → []
```

```ts [Fluent]
chain.operations // the whole chain, as a copy
chain.hasOp(blur) // → false
chain.getOp(resize) // → { name: 'resize', params: ['300x'] }
chain.getAllOps(overlay) // → []
```

:::

An operation is `{ name, params }`, and `params` holds plain strings. Reading a current width means reading `params[0]`, which is `'300x'` here rather than a number. The library never parses parameter values back out.

### I want to insert at the front, or reorder

::: code-group

```ts [Atomic]
mapOperations(stored, (ops) => [blur(10), ...ops])
mapOperations(stored, (ops) => [...ops.slice(0, 1), blur(10), ...ops.slice(1)])
mapOperations(stored, (ops) => ops.reverse())
```

```ts [Builder]
url.updateOperations((ops) => [blur(10), ...ops]).href
url.updateOperations((ops) => ops.reverse()).href
```

```ts [Fluent]
chain.updateOperations((ops) => [blur(10), ...ops]).href
chain.updateOperations((ops) => ops.reverse()).href
```

:::

`updateOperations` hands the callback a copy and requires an array back. A block-bodied arrow that forgets the `return` throws a `TypeError` in the development bundle and leaves the chain untouched in production.

Before reordering, check that you aren't separating an operation from the one it configures. See [why isn't my text styled](#i-want-to-know-why-my-text-isn-t-styled).

### I want to edit a video conversion path

::: code-group

```ts [Atomic]
import { size, thumbs, videoPath } from '@uploadcare/cdn-url/video'

const video = [size({ width: 720 }), thumbs(5)]
const smaller = video.map((op) =>
  operationMatches(op, size) ? size({ width: 480 }) : op
)

videoPath(uuid, smaller)
// → /<uuid>/video/-/size/480x/-/thumbs~5/
```

```ts [Builder]
import { size, thumbs } from '@uploadcare/cdn-url/video'

new CdnUrl({
  origin,
  uuid,
  conversion: 'video',
  operations: [size({ width: 480 }), thumbs(5)]
}).href
// → https://ucarecdn.com/<uuid>/video/-/size/480x/-/thumbs~5/
```

```ts [Fluent]
import { size } from '@uploadcare/cdn-url/video'

cdn
  .video(uuid)
  .size({ width: 720 })
  .thumbs(5)
  .updateOperations((ops) =>
    ops.map((op) => (operationMatches(op, size) ? size({ width: 480 }) : op))
  ).path
// → /<uuid>/video/-/size/480x/-/thumbs~5/
```

:::

::: warning Paths, not URLs
Video and document conversions are **paths** you submit to the REST convert API, not URLs you serve. Atomic and fluent both give you `/<uuid>/video/…`. The builder attaches the origin and gives you a full URL, which is the wrong shape for the convert API. Reach for it only when you actually want a URL.

Conversion chains also can't be re-parsed: `parseCdnUrl` and `cdn.parse` only read file, group, group-element and proxy URLs. Build the operations before you serialize.
:::

Match with `operationMatches`, never `op.name === 'size'`. Counted operations fuse the count into the name: `thumbs(5)` is literally called `thumbs~5`, so a string comparison against `'thumbs'` never fires.

### I want the smallest possible bundle

When a size budget decides the design and the URL is a single file you already know the shape of, skip the operation model: edit the chain as a string.

```ts
import {
  joinModifiers,
  modifiers,
  tinyBuild,
  tinyParse
} from '@uploadcare/cdn-url/tiny'

const parts = tinyParse(stored)
const url = tinyBuild({
  ...parts,
  modifiers: joinModifiers(parts.modifiers, modifiers('blur/10'))
})
// → https://ucarecdn.com/<uuid>/-/resize/300x/-/quality/smart/-/blur/10/
```

419 B gzipped against 1487 B for the Atomic tab. The operations stay type-checked, but nothing is validated at run time, there are no kinds, and it is **file URLs only** — replacing the chain on a group element or a conversion result destroys the URL. Read [The string-level API](/guide/string-level-api) before using it; it is the one style that can hand you a broken URL without an error.

## Understanding a chain

These read a chain rather than build one, so they are the same in every style.

### I want to know if an operation can be repeated

```ts
import { isStackable } from '@uploadcare/cdn-url/validate'
import { quality } from '@uploadcare/cdn-url/ops'

isStackable(overlay) // → true, layering several is meaningful
isStackable(quality) // → false, a second one just wins
```

That tells you how to edit it. `false` means replace the existing occurrence in place; `true` means decide deliberately between collapsing the duplicates into one and appending another layer.

### I want to know why my text isn't styled

`font`, `text_align` and `text_box` are state for the `text` that **follows** them. Put one after its `text` and it silently does nothing.

```ts
import { operationInputs } from '@uploadcare/cdn-url/validate'
import { font, text, textAlign } from '@uploadcare/cdn-url/ops'

const styled = [
  font(24),
  textAlign('center', 'bottom'),
  text(['80p', '20p'], 'bottom', 'Hi')
]

operationInputs(styled, 'text').map((edge) => edge.operation.name)
// → ['font', 'text_align'], what actually applies to that text
```

Each edge is `{ kind, operation, index, reason }`. The nearest preceding modifier wins, so a second `font` overrides the first. A name argument resolves to the first matching operation; pass an element of the array to pin a specific one. `validateOperations` reports the orphaned case as `modifier-without-target`.

### I want to know if a string is even an Uploadcare URL

```ts
import { detectDomainKind, isUploadcareDomain } from '@uploadcare/cdn-url'

isUploadcareDomain('https://cdn.example.com') // → false
detectDomainKind('https://1zlmtnsbgr.ucarecd.net') // → 'prefixed'
```

`detectDomainKind` returns `'legacy'` (`ucarecdn.com`), `'prefixed'` (`*.ucarecd.net`), `'proxy'` (`*.ucr.io`), or `'custom'` for anything else. A CNAME you own reports `custom`, which is a correct answer rather than a failure. Input that isn't a URL at all throws a `TypeError`.

## Things that don't work the way you'd expect

### I want to keep my signed URL working after editing it

**You can't.** [Secure delivery](https://uploadcare.com/docs/security/secure-delivery/) tokens survive parse and serialize untouched, but they sign the URL _including_ its operations. Change the chain and the old signature no longer matches the path.

::: code-group

```ts [Atomic]
const signed = `${origin}/${uuid}/-/preview/300x300/?token=abc123`

mapOperations(signed, (ops) => [...ops, resize({ width: 400 })])
// still carries ?token=abc123, and the CDN will now reject it
```

```ts [Builder]
const signed = `${origin}/${uuid}/-/preview/300x300/?token=abc123`

CdnUrl.parse(signed).with(resize({ width: 400 })).href
// still carries ?token=abc123, and the CDN will now reject it
```

```ts [Fluent]
const signed = `${origin}/${uuid}/-/preview/300x300/?token=abc123`

const s = cdn.parse(signed)
if (s.kind === 'file') s.resize({ width: 400 }).href
// still carries ?token=abc123, and the CDN will now reject it
```

:::

Re-sign after editing, or build the final chain before signing. This library preserves tokens but never generates them; signing happens in your backend.

### Parsing does not validate values

`parseCdnUrl` and `parseOperations` are deliberately lenient. They accept any well-formed chain, including unknown operations and out-of-range numbers, and pass them through verbatim. `blur/99999` parses fine.

For untrusted input, run [validateOperations](/how-to/validate-user-input) explicitly, or build operations from typed parameters instead of accepting raw modifier strings.

### Development-bundle checks don't run in production

Operation creators validate ranges and enums eagerly, but only in the development bundle. Production strips those checks and the contract becomes garbage in, garbage out. The `validate` entry is the exception: it works identically in both. See [dev & production bundles](/guide/bundles).

## Going deeper

The editing recipes above are the full treatment; there's no deeper page for them. For everything else:

| I want to…                       | See                                                        |
| -------------------------------- | ---------------------------------------------------------- |
| render URLs stored in a database | [Render stored URLs](/how-to/render-stored-urls)           |
| build a `srcset`                 | [Responsive images](/how-to/responsive-images)             |
| crop faces into square avatars   | [Avatars](/how-to/avatars)                                 |
| transform a remote image         | [Remote images via proxy](/how-to/remote-images-via-proxy) |
| address group files, build a zip | [Groups & archives](/how-to/groups-and-archives)           |
| convert video or documents       | [Video & documents](/how-to/video-and-documents)           |
| vet user-supplied modifiers      | [Validate user input](/how-to/validate-user-input)         |
| choose between the four styles   | [API styles & tree-shaking](/guide/functional-vs-builder)  |
| edit URLs on a byte budget       | [The string-level API](/guide/string-level-api)            |
| use it without a bundler         | [Getting started](/guide/getting-started)                  |
