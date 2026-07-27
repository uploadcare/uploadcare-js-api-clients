# Cookbook

Task-shaped index. Find what you're trying to do, take the snippet. The other how-to pages go deep on one topic; this one goes wide across tasks.

## Before you start

**Prefer the atomic imports.** Every operation creator is an independent atom and every entry point is separate, so a bundler drops whatever you don't name. That is the whole point of the package, and the difference is real:

| what you import                  | gzipped |
| -------------------------------- | ------- |
| functional core + one op creator | 1311 B  |
| `CdnUrl` builder + one op        | 1888 B  |
| the `cdn` fluent object          | 4129 B  |

Recipes below use the functional core. The chainable facades do the same work and are covered in [API styles & tree-shaking](/guide/functional-vs-builder); a translation table sits at the [end of this page](#the-same-recipes-with-a-chainable-api).

**Everything is a value.** `parseCdnUrl` gives you a plain object, operations are a plain array, and `serializeCdnUrl` turns it back into a string. Nothing is mutated for you.

**Creators double as references.** Anywhere a recipe identifies an operation, you can pass its name (`'resize'`), an operation object, or the uncalled creator (`resize`). The creator form is typo-proof and resolves aliases — `cropByRatio` refers to the `crop` directive it produces.

Every snippet below assumes these bindings:

```ts
import type { CdnOperation } from '@uploadcare/cdn-url'
import {
  operationMatches,
  parseCdnUrl,
  serializeCdnUrl
} from '@uploadcare/cdn-url'
import { blur, overlay, resize, scaleCrop } from '@uploadcare/cdn-url/ops'

const uuid = 'c2499162-eb07-4b93-b31e-94a89a47e858'

// a URL you loaded from your database
const stored = `https://ucarecdn.com/${uuid}/-/resize/300x/-/quality/smart/`

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

That six-line helper carries every editing recipe on this page, and it pulls in nothing but the two core functions.

`parseCdnUrl` throws a `TypeError` on input that isn't a CDN URL — malformed strings and URLs with an empty path both fail — so wrap it when the input is a database row you don't control.

## Getting a URL out

### I want a thumbnail from a uuid

```ts
serializeCdnUrl({
  kind: 'file',
  origin: 'https://ucarecdn.com',
  uuid,
  conversion: null,
  operations: [scaleCrop(300, 300, { type: 'smart' })],
  filename: null,
  search: '',
  hash: ''
})
// → https://ucarecdn.com/<uuid>/-/scale_crop/300x300/smart/
```

`ParsedCdnUrl` is a discriminated union — `kind` selects which fields apply, and a `file` needs all of the above. One core operation is enough: the CDN applies `format/auto` on its own once a chain does any processing, and adaptive quality is the default for projects created on or after 2025-08-04.

### I want to swap the CDN domain

```ts
const parsed = parseCdnUrl(stored)
serializeCdnUrl({ ...parsed, origin: 'https://1zlmtnsbgr.ucarecd.net' })
```

`ucarecd.net` is not a typo — it's the project-prefixed zone, distinct from the legacy `ucarecdn.com`.

### I want a download filename on the URL

```ts
const file = parseCdnUrl(stored)
if (file.kind === 'file') {
  serializeCdnUrl({ ...file, filename: 'invoice-2026.pdf' })
  // → https://ucarecdn.com/<uuid>/-/resize/300x/-/quality/smart/invoice-2026.pdf
}
```

Use `null` to clear it. The `kind` check is what stops you attaching a filename to a group root or proxy URL, which cannot carry one.

### I want the original file, no operations

```ts
mapOperations(stored, () => [])
// → https://ucarecdn.com/<uuid>/
```

This clears the operation chain only. A filename, a `?token=` query and a conversion prefix all survive — clear those explicitly:

```ts
const withToken = parseCdnUrl(`${stored}?token=abc123`)
serializeCdnUrl({ ...withToken, search: '' })
```

## Editing a chain

### I want to change one operation and keep the rest

```ts
mapOperations(stored, (ops) =>
  ops.map((op) => (operationMatches(op, resize) ? resize({ width: 500 }) : op))
)
// → https://ucarecdn.com/<uuid>/-/resize/500x/-/quality/smart/
```

Being explicit has a payoff here: if the stored URL sized its image with `scale_crop` rather than `resize`, this leaves it alone rather than quietly adding a second sizing operation. The builder's `replace` appends in that case — see the [translation table](#the-same-recipes-with-a-chainable-api).

### I want to change the second overlay, not the first

```ts
const replacement = overlay(uuid, { size: ['50p', '50p'] })

let seen = 0
mapOperations(stored, (ops) =>
  ops.map((op) =>
    operationMatches(op, overlay) && seen++ === 1 ? replacement : op
  )
)
```

`seen++ === 1` picks the second match — zero-based, like an array index.

### I want to add an operation only if it isn't there

```ts
mapOperations(stored, (ops) =>
  ops.some((op) => operationMatches(op, blur)) ? ops : [...ops, blur(10)]
)
```

### I want to see what's in a URL

```ts
const chain = parseCdnUrl(stored)
const ops = 'operations' in chain ? chain.operations : []

ops.some((op) => operationMatches(op, blur)) // → false
ops.find((op) => operationMatches(op, resize)) // → { name: 'resize', params: ['300x'] }
ops.filter((op) => operationMatches(op, overlay)) // → []
```

An operation is `{ name, params }`, both plain strings — so reading a current width means reading `params[0]`, which is `'300x'` here, not a number. The library never parses parameter values back out.

### I want to insert at the front, or reorder

```ts
mapOperations(stored, (ops) => [blur(10), ...ops])
mapOperations(stored, (ops) => [...ops.slice(0, 1), blur(10), ...ops.slice(1)])
mapOperations(stored, (ops) => ops.reverse())
```

Before reordering, check you aren't separating an operation from the one it configures — see [why isn't my text styled](#i-want-to-know-why-my-text-isn-t-styled).

### I want to edit a video conversion path

Conversion paths are built, not parsed — `parseCdnUrl` only reads file, group, group-element and proxy URLs, so there is no round trip. Build the operation array yourself and hand it to `videoPath`:

```ts
import { size, thumbs, videoPath } from '@uploadcare/cdn-url/video'

const video = [size({ width: 720 }), thumbs(5)]
const smaller = video.map((op) =>
  operationMatches(op, size) ? size({ width: 480 }) : op
)

videoPath(uuid, smaller)
// → /<uuid>/video/-/size/480x/-/thumbs~5/
```

Match with `operationMatches`, never `op.name === 'size'`. Counted operations fuse the count into the name — `thumbs(5)` is literally named `thumbs~5` — so a string comparison against `'thumbs'` never fires. `operationMatches` compares base names and gets it right.

## Understanding a chain

### I want to know if an operation can be repeated

```ts
import { isStackable } from '@uploadcare/cdn-url/validate'
import { quality } from '@uploadcare/cdn-url/ops'

isStackable(overlay) // → true — layering several is meaningful
isStackable(quality) // → false — a second one just wins
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
// → ['font', 'text_align'] — what actually applies to that text
```

Each edge is `{ kind, operation, index, reason }`. The nearest preceding modifier wins, so a second `font` overrides the first. A name argument resolves to the first matching operation; pass an element of the array to pin a specific one. `validateOperations` reports the orphaned case as `modifier-without-target`.

### I want to know if a string is even an Uploadcare URL

```ts
import { detectDomainKind, isUploadcareDomain } from '@uploadcare/cdn-url'

isUploadcareDomain('https://cdn.example.com') // → false
detectDomainKind('https://1zlmtnsbgr.ucarecd.net') // → 'prefixed'
```

`detectDomainKind` returns `'legacy'` (`ucarecdn.com`), `'prefixed'` (`*.ucarecd.net`), `'proxy'` (`*.ucr.io`) or `'custom'` for anything else — a CNAME you own reports `custom`, which is a correct answer rather than a failure. It throws a `TypeError` on input that isn't a URL at all.

## Things that don't work the way you'd expect

### I want to keep my signed URL working after editing it

**You can't.** [Secure delivery](https://uploadcare.com/docs/security/secure-delivery/) tokens survive parse and serialize untouched, but they sign the URL _including_ its operations. Change the chain and the old signature no longer matches the path:

```ts
const signed = `https://ucarecdn.com/${uuid}/-/preview/300x300/?token=abc123`

mapOperations(signed, (ops) => [...ops, resize({ width: 400 })])
// still carries ?token=abc123 — and the CDN will now reject it
```

Re-sign after editing, or build the final chain before signing. This library preserves tokens but never generates them; signing happens in your backend.

### Parsing does not validate values

`parseCdnUrl` and `parseOperations` are deliberately lenient — they accept any well-formed chain, including unknown operations and out-of-range numbers, and pass them through verbatim. `blur/99999` parses fine.

For untrusted input, run [validateOperations](/how-to/validate-user-input) explicitly, or build operations from typed parameters instead of accepting raw modifier strings.

### Development-bundle checks don't run in production

Operation creators validate ranges and enums eagerly — in the development bundle. Production strips those checks and the contract becomes garbage-in, garbage-out. The `validate` entry is the exception: it works identically in both. See [dev & production bundles](/guide/bundles).

## The same recipes with a chainable API

If bundle size isn't the binding constraint, `CdnUrl` (+577 B gzipped) and `cdn` (+2818 B) do the same work in fewer characters. The behaviour differs in two places worth knowing.

```ts
import { CdnUrl } from '@uploadcare/cdn-url/builder'

const url = CdnUrl.parse(stored)
```

| functional                                          | chainable                             |
| --------------------------------------------------- | ------------------------------------- |
| `mapOperations(u, () => [])`                        | `url.updateOperations(() => [])`      |
| `ops.some((op) => operationMatches(op, blur))`      | `url.has(blur)`                       |
| `ops.find((op) => operationMatches(op, resize))`    | `url.get(resize)`                     |
| `ops.filter((op) => operationMatches(op, overlay))` | `url.getAll(overlay)`                 |
| `ops.map(…)` swapping one match                     | `url.replace(resize({ width: 500 }))` |
| collapse duplicates to one                          | `url.replaceAll(overlay(uuid, …))`    |
| `mapOperations(u, fn)`                              | `url.updateOperations(fn)`            |

Two behavioural differences, not just shorter spellings:

- **`replace` appends when nothing matches.** If the chain sizes with `scale_crop` and you `replace(resize(...))`, you get both operations. Guard with `url.has(resize) ? … : url` when the incoming chain isn't yours. `replaceAll` appends on zero matches too.
- **`updateOperations` must return an array.** A block-bodied arrow that forgets the `return` throws a `TypeError` in the development bundle and leaves the chain untouched in production.

Fluent chains carry the same set with an `Op` suffix — `hasOp`, `getOp`, `getAllOps`, `replaceOp`, `replaceAllOps`, `withoutOp` — so the names can never collide with a transformation method. On a `video`/`document`/`gif2video` chain, `updateOperations` is the only edit path, since those emit a `.path` that can't be parsed back.

## Going deeper

The editing recipes above are the full treatment — there's no deeper page for them. For everything else:

| I want to…                       | See                                                        |
| -------------------------------- | ---------------------------------------------------------- |
| render URLs stored in a database | [Render stored URLs](/how-to/render-stored-urls)           |
| build a `srcset`                 | [Responsive images](/how-to/responsive-images)             |
| crop faces into square avatars   | [Avatars](/how-to/avatars)                                 |
| transform a remote image         | [Remote images via proxy](/how-to/remote-images-via-proxy) |
| address group files, build a zip | [Groups & archives](/how-to/groups-and-archives)           |
| convert video or documents       | [Video & documents](/how-to/video-and-documents)           |
| vet user-supplied modifiers      | [Validate user input](/how-to/validate-user-input)         |
| ship the smallest bundle         | [API styles & tree-shaking](/guide/functional-vs-builder)  |
| use it without a bundler         | [Getting started](/guide/getting-started)                  |
