# Functional core vs builder vs fluent

The library has four API styles over the same data model. They produce identical URLs; the difference is ergonomics and bundle size. Three of them are below; the fourth, [the string-level API](/guide/string-level-api), drops the data model entirely and trades validation for bytes.

## The functional core

Pure functions over plain objects. Editing is object spread and array methods:

```ts
import { parseCdnUrl, serializeCdnUrl } from '@uploadcare/cdn-url'
import { preview, quality } from '@uploadcare/cdn-url/ops'

const parsed = parseCdnUrl(src)
const url = serializeCdnUrl({
  ...parsed,
  operations: [
    ...parsed.operations.filter((op) => op.name !== 'quality'),
    preview(800, 600),
    quality('smart')
  ]
})
```

## The builder facade

An immutable chainable wrapper. Every method returns a new instance:

```ts
import { CdnUrl } from '@uploadcare/cdn-url/builder'
import { preview, quality } from '@uploadcare/cdn-url/ops'

const url = CdnUrl.parse(src)
  .without(quality)
  .with(preview(800, 600), quality('smart'))
  .base('https://1zlmtnsbgr.ucarecd.net').href
```

`with`, `without`, `replace`, `replaceAll`, `has`, `get`, `getAll`, `updateOperations`, `filename`, `base`: see the [builder reference](/reference/builder/).

### Inspecting and overriding a chain

Refs are interchangeable: an operation name, an operation object, or the creator itself. Aliases resolve to the directive they produce (`cropByRatio` → `crop`), and counted video operations match on their base name (`thumbs~5` ↔ `thumbs`).

```ts
const url = CdnUrl.parse(src)

url.has(quality) // is a quality set?
url.get(quality) // → { name: 'quality', params: ['smart'] } | null
url.getAll(overlay) // → every overlay, in chain order

url.replace(resize({ width: 500 })) // swap the first match, or append
url.replaceAll(overlay(uuid, { size: ['50p', '50p'] })) // collapse to exactly one
```

`replace` touches only the first match, which is what you want for a single-valued operation like `resize` or `quality`. For a [stackable](/how-to/validate-user-input#stackable-operations) operation that legitimately repeats, reach for `replaceAll`, otherwise you rewrite the first `overlay` and leave the rest in place.

### Editing by position

Neither one helps when you mean _the second overlay_, or _the overlay with these parameters_. `updateOperations` is the primitive underneath all of them: it hands your callback the chain as a plain array and takes the result as the new chain.

```ts
// replace the second overlay, leaving the others alone
let seen = -1
url.updateOperations((ops) =>
  ops.map((op) => (operationMatches(op, overlay) && ++seen === 1 ? next : op))
)

url.updateOperations((ops) => [quality('smart'), ...ops]) // prepend
url.updateOperations((ops) => [...ops.slice(0, 2), next, ...ops.slice(2)]) // insert at
url.updateOperations((ops) => ops.filter((op) => op.params[1] !== '90p,90p')) // by params
```

The callback gets a defensive copy, so mutating it in place is safe. `with`, `without`, `replace` and `replaceAll` are all sugar over this. Use them when they fit, and drop to `updateOperations` when they don't.

## The fluent mega-object

Everything behind one import: every URL flavor, every operation, chainable end to end. Made for application code and REPL exploration where convenience beats bytes.

`cdn` arrives without a host. `base` binds one and hands back the full object; `file`, `group` and `gif2video` exist only there, so forgetting is a compile error rather than a broken URL. The starters that need no host — `video`, `document`, `proxy`, `parse` — work straight off `cdn`. Every object is frozen, and a single URL rebases with its own `base()`.

```ts
import { cdn } from '@uploadcare/cdn-url/fluent'
import { prefixedCdnBase } from '@uploadcare/cdn-url/cdn-base'

const myCdn = cdn.base(prefixedCdnBase('demopublickey'))

myCdn.file(uuid).scaleCrop(96, 96, { type: 'smart' }).borderRadius('50p').href
cdn.parse(stored).kind // 'file' | 'group' | 'group-element' | 'proxy'; narrow, keep chaining
myCdn.group(groupId).nth(1).preview(300, 300).href
cdn.video(uuid).size({ width: 720, height: 540 }).thumbs(5).path
myCdn.file(uuid).preview().base('https://cdn.example.com').href
```

Each starter returns a kind-specific chain (video chains only offer video methods, group roots only `nth()`/`archive()`), so invalid combinations are compile-time errors. Chains are immutable and reuse the creators' development-bundle validation.

Method names follow three rules, and knowing them saves guessing:

- **transformations are named after the operation** — `preview()`, `resize()`, `blur()`, one per CDN directive;
- **the parts of the URL that are not operations are named after themselves** — `base()`, `filename()`, `proxy()`, matching the builder's methods exactly;
- **inspection carries an `Op` suffix** — `hasOp()`, `getOp()`, `getAllOps()`, `replaceOp()`, `withoutOp()`, `updateOperations()`. The suffix exists because a bare `get` or `with` would collide with an operation name; it is the one place the fluent and builder surfaces cannot align.

The builder's inspection API is mirrored on every chain, with an `Op` suffix so the names can never collide with a transformation method:

```ts
const chain = myCdn.file(uuid).resize({ width: 300 }).quality('smart')

chain.hasOp(quality) // → true
chain.getOp(quality) // → { name: 'quality', params: ['smart'] } | null
chain.getAllOps('overlay') // → every overlay
chain.replaceOp(resize({ width: 500 })) // swap the first match, or append
chain.replaceAllOps({ name: 'overlay', params: [uuid] }) // collapse to one
chain.withoutOp(quality) // drop every match
chain.op('custom', 'arg') // append anything, unvalidated
chain.updateOperations((ops) => ops.reverse()) // rewrite the whole chain
```

`updateOperations` matters most on conversion chains. A `video`/`document`/`gif2video` chain emits a `.path`, and `cdn.parse` only re-enters `file`/`group`/`group-element`/`proxy` urls, so there is no round-trip back into the chain. The callback is their only edit path:

```ts
cdn
  .video(uuid)
  .size({ width: 720 })
  .thumbs(5)
  .updateOperations((ops) =>
    ops.map((op) => (op.name === 'size' ? size({ width: 480 }) : op))
  ).path // → /uuid/video/-/size/480x/-/thumbs~5/
```

Also available without a bundler at all, via the IIFE global build:

```html
<script src="https://unpkg.com/@uploadcare/cdn-url/dist/cdn-url.global.js"></script>
<script>
  const cdn = UCCdnUrl.base(UCCdnUrl.prefixedCdnBase('YOUR_PUBLIC_KEY'))
  myCdn.file(uuid).preview(800, 600).href
</script>
```

## The string level

The fourth style drops the data model. A chain is one string, a file URL is a handful of named strings, and there are no operation objects to build or inspect:

```ts
import {
  joinModifiers,
  modifiers,
  tinyBuild,
  tinyParse
} from '@uploadcare/cdn-url/tiny'

const parts = tinyParse(src)
const url = tinyBuild({
  ...parts,
  modifiers: joinModifiers(parts.modifiers, modifiers('preview/800x600'))
})
```

The operations are still type-checked — `modifiers('rezise/800x')` does not compile — but nothing is validated at run time, there are no URL kinds, and it handles **single-file URLs only**. In exchange it is 362 B brotli against 1844 B for the same edit through the builder.

That trade is only worth it under a real size budget, and only when you already know the URL is a file URL: see [The string-level API](/guide/string-level-api) for what it gets wrong and where it corrupts URLs if you feed it the wrong kind.

## Tree-shaking: what you actually ship

Every entry point is independent, and `sideEffects: false` lets bundlers drop everything you don't import. Each operation creator is an atom: importing `preview` does not pull in the other 46.

What each entry costs when you import everything it exports, bundled and minified from the production build. Shared chunks are included, so these are the real numbers rather than per-file sizes:

| Import                                  | Minified | Gzipped |
| --------------------------------------- | -------- | ------- |
| `proxy`                                 | 0.4 kB   | 0.3 kB  |
| `document`                              | 0.6 kB   | 0.4 kB  |
| `video`                                 | 0.9 kB   | 0.6 kB  |
| `gif2video`                             | 1.2 kB   | 0.6 kB  |
| `group`                                 | 1.4 kB   | 0.7 kB  |
| `validate`                              | 5.2 kB   | 2.1 kB  |
| `builder`                               | 5.7 kB   | 2.0 kB  |
| `tiny` (string level)                   | 0.9 kB   | 0.5 kB  |
| `index` (everything below, re-exported) | 8.1 kB   | 3.3 kB  |
| `ops` (all 47 creators)                 | 6.1 kB   | 2.2 kB  |
| `fluent` (the `cdn` mega-object)        | 17.4 kB  | 5.9 kB  |

No total above includes `prefixedCdnBase` — the SHA-256 that derives your project's host lives in its own entry, [`@uploadcare/cdn-url/cdn-base`](/guide/cdn-base), so a bundle carries it only if it imports that entry. Doing so adds 1.9 kB minified (1.2 kB gzipped): `cdn` plus one chain measures 15.0 kB minified, 4.4 kB gzipped on its own, and 17.0 kB (5.7 kB gzipped) once it derives the host. Compute the host at build time or paste it as a literal and you pay nothing for the hashing.

Importing everything is the worst case, and it is not what most code does. The core plus one creator is about 1.6 kB gzipped, not 2.2 plus 2.0, because the creators you don't name are dropped. The [string level](/guide/string-level-api) does the same job for 0.4 kB, and costs the same whether you import it from `/tiny` or from the root — 348 B versus 347 B brotli, measured.

The `fluent` entry is the one exception to "you only pay for what you import": reaching for `cdn.base()` pulls in the whole library, and it cannot tree-shake by design. That's the deal: one import, full surface. If size matters, use the functional core or `builder` instead.

## Which to use

- Building URLs in a library, a framework loader, or anything size-sensitive: functional core. You'll likely ship under 2 kB.
- Application code that edits URLs in several places: the builder reads better and is harder to misuse (it knows group roots can't take operations, for instance).
- Scripts, prototypes, and app code that touches many URL flavors: the fluent entry. One import, full surface, kind-safe chains.
- Under a hard size budget — a framework loader, an inlined script: [the string-level API](/guide/string-level-api). No operation objects and no validation, at about a third of the bytes of the narrowest path above.
- Mixing is fine. The builder accepts the same operation objects (`.with(preview(800, 600))`), and `toJSON()` hands you back the plain parsed shape whenever you want to drop down.
