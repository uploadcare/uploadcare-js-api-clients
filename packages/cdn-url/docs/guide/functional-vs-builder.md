# Functional core vs builder vs fluent

The library has three API styles over the same data model. They produce identical URLs — the difference is ergonomics and bundle size.

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

An immutable chainable wrapper — every method returns a new instance:

```ts
import { CdnUrl } from '@uploadcare/cdn-url/builder'
import { preview, quality } from '@uploadcare/cdn-url/ops'

const url = CdnUrl.parse(src)
  .without(quality)
  .with(preview(800, 600), quality('smart'))
  .setOrigin('https://1zlmtnsbgr.ucarecd.net').href
```

`with`, `without`, `replace`, `has`, `get`, `setFilename`, `setOrigin` — see the [builder reference](/reference/builder/).

## The fluent mega-object

Everything behind one import — every URL flavor, every operation, chainable end to end. Made for application code and REPL exploration where convenience beats bytes:

```ts
import { cdn } from '@uploadcare/cdn-url/fluent'

cdn.file(uuid).scaleCrop(96, 96, { type: 'smart' }).borderRadius('50p').href
cdn.parse(stored).kind // 'file' | 'group' | 'group-element' | 'proxy' — narrow, keep chaining
cdn.group(groupId).nth(1).preview(300, 300).href
cdn.video(uuid).size({ width: 720, height: 540 }).thumbs(5).path
cdn.configure({ origin: 'https://cdn.example.com' }).file(uuid).preview().href
```

Each starter returns a kind-specific chain — video chains only offer video methods, group roots only `nth()`/`archive()` — so invalid combinations are compile-time errors. Chains are immutable and reuse the creators' development-bundle validation.

Also available without a bundler at all, via the IIFE global build:

```html
<script src="https://unpkg.com/@uploadcare/cdn-url/dist/cdn-url.global.js"></script>
<script>
  UCCdnUrl.cdn.file(uuid).preview(800, 600).href
</script>
```

## Tree-shaking: what you actually ship

Every entry point is independent, and `sideEffects: false` lets bundlers drop everything you don't import. Each operation creator is an atom — importing `preview` does not pull in the other 44.

Production bundle weight per entry (minified, not gzipped):

| Import                                | Cost                                                                  |
| ------------------------------------- | --------------------------------------------------------------------- |
| `proxy`                               | ~0.4 kB                                                               |
| `index` (parse + serialize + domains) | ~0.6 kB + shared chunks                                               |
| `group`, `document`, `gif2video`      | ~1 kB each                                                            |
| `video`                               | ~1.5 kB                                                               |
| `builder`                             | ~3.7 kB — it carries parse **and** serialize                          |
| `ops` (all 45 creators)               | ~6 kB; a handful of creators: a fraction of that                      |
| `fluent` (the `cdn` mega-object)      | ~14 kB — every flavor + all 45 creators; cannot tree-shake, by design |

The `fluent` entry is the one exception to "you only pay for what you import": reaching for `cdn` pulls in the whole library. That's the deal — one import, full surface. If size matters, use the functional core or `builder` instead.

## Which to use

- **Building URLs in a library, a framework loader, or anything size-sensitive** — functional core. You'll likely ship under 2 kB.
- **Application code that edits URLs in several places** — the builder reads better and is harder to misuse (it knows group roots can't take operations, for instance).
- **Scripts, prototypes, app code that touches many URL flavors** — the fluent `cdn` object. One import, full surface, kind-safe chains.
- **Mixing is fine.** The builder accepts the same operation objects (`.with(preview(800, 600))`), and `toJSON()` hands you back the plain parsed shape whenever you want to drop down.
