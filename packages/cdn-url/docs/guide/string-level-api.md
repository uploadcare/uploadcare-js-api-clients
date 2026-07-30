# The string-level API

Everything else in this library treats an operation as data — `{ name: 'blur', params: ['10'] }`, built by a creator from [`/ops`](/reference/ops/), validated, inspectable. This API treats the modifier chain as one string and a file URL as a handful of named strings.

It costs runtime validation, URL kinds, and the ability to inspect what you are editing. What it buys is bytes: 362 B brotli, against 821 B for the narrowest full-model path and 4520 B for the fluent `cdn` object, [measured below](#what-it-costs).

Examples import from `@uploadcare/cdn-url/tiny`, the dedicated entry. Everything here is re-exported from the root entry too, and costs the same either way — 348 B against 347 B brotli — so use whichever import path your code already has.

Throughout this page `:uuid` stands in for a real file uuid, and `parts` for a value of the exported type `TinyFileUrl`.

::: tip File URLs only, and only when you already know it is one
`tinyParse` handles `/:uuid/-/…/filename` and nothing else. It cannot tell what kind of URL you gave it and has no way to tell you, so the caller has to know. If your input is of unknown kind, checking costs more than simply using [`parseFileUrl`](/reference/index/functions/parseFileUrl), which validates as well. See [What it costs](#what-it-costs).

Reach for this level when the URLs are file URLs by construction — ones your own code built, or a field you control — and a size budget decides the design.
:::

## Operation vs modifiers

The two words are not interchangeable.

An **operation** is one directive: `resize/300x`. It has a name and positional parameters, and the full API models it as data — `{ name: 'resize', params: ['300x'] }`, which is what a creator like `resize({ width: 300 })` returns and what `parseOperations` gives you back.

**Modifiers** are the whole run of operations as they appear in a URL, serialized: `-/resize/300x/-/blur/10/`. Inside a URL each operation is introduced by `-/` and closed by `/`, which is what separates them; the `-/` is a serialization detail, so the literals you write omit it. Uploadcare's own API uses this word too — a file's stored transformation string is its `cdnUrlModifiers`.

```text
resize/300x                            one operation, as a typed literal
{ name: 'resize', params: ['300x'] }   the same operation, as data
-/resize/300x/-/blur/10/               modifiers: two operations, serialized
```

One modifiers string holds zero or more operations, which is why `modifiers('resize/300x', 'blur/10')` takes operations and returns modifiers, and `parseOperations` goes the other way. The `modifiers` field of a parsed URL is always the whole chain, never a single operation.

## What it costs

Each bundle below parses a URL, adds one `blur`, and serializes it — except the kind-unknown row, which adds a check and no operation, so its number is a floor rather than a like-for-like. Bundled with `esbuild --bundle --minify` against the production build, shared chunks included:

| The API                       | What it imports                                          | Raw     | Gzip   | Brotli |
| ----------------------------- | -------------------------------------------------------- | ------- | ------ | ------ |
| fluent                        | `cdn.parse(url)` → `.blur(10)` → `.href`                 | 16303 B | 4967 B | 4520 B |
| builder                       | `CdnUrl.parse(url).with(blur(10)).href`                  | 6011 B  | 2041 B | 1844 B |
| functional, any kind          | `parseCdnUrl` + `serializeCdnUrl` + `blur(10)`           | 4110 B  | 1487 B | 1326 B |
| string level, kind unknown    | `tinyParse` + `tinyBuild` + an `isFileUrl` guard         | 2074 B  | 1001 B | 890 B  |
| functional, file only         | `parseFileUrl` + `serializeFileUrl` + `blur(10)`         | 1894 B  | 933 B  | 821 B  |
| string level, kind known      | `tinyParse` + `tinyBuild` + `modifiers('blur/10')`       | 751 B   | 419 B  | 362 B  |
| string level, untrusted input | `tinyParse` + `tinyBuild` + `normalizeModifiers(stored)` | 768 B   | 439 B  | 373 B  |

The two facades at the top are the ones most code reaches for, and they are 5× and 12× the string level. That gap is the entire reason this API exists — the `cdn` mega-object cannot tree-shake by design, so `fluent` is a floor, not a worst case.

Compare the two middle rows instead if you want the honest decision: guarding an unknown URL with `isFileUrl` pulls the real parser back in, landing 8% _above_ `parseFileUrl` — which also validates and hands you kinds. The bytes are close; the point is that you get strictly less for them. The string level pays off only once the kind is settled, and then it is 44% of `parseFileUrl` (362 vs 821 B brotli).

Row five is worth noting too: accepting an untrusted stored string costs slightly more than authoring literals, because `normalizeModifiers` ships its own normalization.

Numbers move as the library changes — measure your own bundle before treating any of this as a budget.

## Writing a chain

`modifiers()` joins typed operation literals:

```ts
import { modifiers } from '@uploadcare/cdn-url/tiny'

const width = 300

modifiers('resize/300x', 'blur/10') // → '-/resize/300x/-/blur/10/'
modifiers() // → '' (the empty chain)
modifiers(`resize/${width}x`) // → '-/resize/300x/'
```

The literals are checked against the operation grammar — every enum, every parameter count — at compile time:

```ts
modifiers('rezise/300x') // ✗ not assignable to OperationLiteral
modifiers('format/gif') // ✗ 'gif' is not a delivery format
```

A template literal in _argument_ position keeps that checking, which is why ``modifiers(`resize/${width}x`)`` above is safe — and it holds for a `number`-typed hole too, not just a literal, because the grammar carries `` `resize/${number}x` ``. An _enum_ slot is stricter: ``modifiers(`format/${value}`)`` needs `value` to be a literal type, since the grammar there is `` `format/${Format}` `` and a plain `string` cannot satisfy it. When your values are neither literals nor numbers, use the creators in [`/ops`](/reference/ops/).

The checking is types only: a JavaScript caller, or a value cast past the types, gets its string joined verbatim.

### Values that arrive as strings

Modifiers reach your code in whatever shape their source produced: a stored `cdnUrlModifiers` field (Uploadcare stores the chain alongside the uuid), a DOM attribute, a config file. `normalizeModifiers()` accepts all of it.

```ts
import { normalizeModifiers } from '@uploadcare/cdn-url/tiny'

normalizeModifiers('resize/100x') // → '-/resize/100x/'
normalizeModifiers('-/resize/100x') // → '-/resize/100x/'
normalizeModifiers('/resize/100x/') // → '-/resize/100x/'
normalizeModifiers('  -/resize/100x/  ') // → '-/resize/100x/'
normalizeModifiers('resize/300x/-/blur/10') // → '-/resize/300x/-/blur/10/'
normalizeModifiers('') // → ''
```

The leading `-` marker, slashes at either end and surrounding whitespace are all optional, and runs of slashes collapse to one; operations within the chain stay `-`-separated, which is what keeps `resize/300x/-/blur/10` unambiguous. Nothing is validated — a malformed chain is accepted, not diagnosed.

### Appending

```ts
import { joinModifiers, modifiers } from '@uploadcare/cdn-url/tiny'

const base = modifiers('preview')
joinModifiers(base, modifiers('resize/300x')) // → '-/preview/-/resize/300x/'
```

`joinModifiers` rather than `` `${a}${b}` `` — see [The chain type is nominal](#the-chain-type-is-nominal).

## Splitting a URL

`tinyParse` cuts a file URL into named strings; `tinyBuild` joins them back:

```ts
import { tinyParse } from '@uploadcare/cdn-url/tiny'

tinyParse('https://ucarecdn.com/:uuid/-/resize/300x/photo.jpg?v=2')
// → {
//     cdnBase: 'https://ucarecdn.com',
//     uuid: ':uuid',
//     modifiers: '-/resize/300x/',
//     filename: 'photo.jpg',
//     search: '?v=2',
//     hash: ''
//   }
```

```
https://ucarecdn.com/:uuid/-/resize/300x/photo.jpg?v=2#top
└──────┬───────────┘└─┬──┘└──────┬─────┘└───┬────┘└─┬┘└─┬┘
     cdnBase          uuid    modifiers   filename search hash
```

The cuts are lexical: the first slash after the host, the last slash of the path, then the first `?` and `#`. The field names are [`ParsedFileUrl`](/reference/index/interfaces/ParsedFileUrl)'s, except that `modifiers` holds the serialized chain where it holds an `operations` array.

Only `cdnBase` and `uuid` are required — everything else defaults to empty, so `tinyBuild` also builds URLs from scratch. The base is yours to supply, exactly as at every other layer; see [The CDN base](/guide/cdn-base), and note that deriving it with `prefixedCdnBase` costs more bytes than everything on this page put together, so a size-conscious caller pastes the host as a literal:

```ts
import { modifiers, tinyBuild } from '@uploadcare/cdn-url/tiny'

const cdnBase = 'https://ucarecdn.com' // a trailing slash is fine too
const uuid = ':uuid'

tinyBuild({ cdnBase, uuid })
// → https://ucarecdn.com/:uuid/

tinyBuild({ cdnBase, uuid, modifiers: modifiers('preview/800x600') })
// → https://ucarecdn.com/:uuid/-/preview/800x600/
```

`search` and `hash` carry their own punctuation, so supply them as `'?v=2'` and `'#top'` — `tinyBuild` writes the slashes between fields but not the `?` or `#`. `filename` is `''` for a URL that ends in a slash.

A trailing slash on `cdnBase` is trimmed for you — config values and `new URL(x).origin` both produce them — so `'https://ucarecdn.com/'` and `'https://ucarecdn.com'` build the same URL, exactly as [`serializeFileUrl`](/reference/index/functions/serializeFileUrl) behaves. That is the only normalization: `uuid` still has to be a bare segment, and a malformed field yields a malformed URL with no error.

Nothing is validated and nothing throws. Unknown operations and internal `@`-prefixed directives (`@clib`) pass through verbatim, which is what makes the round trip exact:

```ts
const url = 'https://ucarecdn.com/:uuid/-/preview/photo.jpg'
tinyBuild(tinyParse(url)) === url // holds for every URL parseCdnUrl accepts
```

Outside that set nothing throws either, but the result may differ, and the fields are nonsense rather than an error:

```ts
tinyBuild(tinyParse('https://ucarecdn.com')) // → 'https://ucarecdn.com//'
tinyParse('not a url') // → { cdnBase: 'not a url', uuid: '', … }
```

Validate before you get here if the input is untrusted — [`isFileUrl`](/reference/index/functions/isFileUrl) is the cheap check, and [What it costs](#what-it-costs) explains why reaching for it usually means you wanted `parseFileUrl` all along.

## Other URL kinds

Anything that is not a single-file URL is out of scope. Such a URL still round-trips byte for byte, because the cuts are lexical, so passing one through untouched is harmless. Its _fields_ are meaningless, though: everything between the first and last slash lands in `modifiers` whether or not it is an operation, so reading the fields tells you nothing and editing them destroys the URL.

Use [`parseCdnUrl`](/reference/index/functions/parseCdnUrl) when the kind is not already known.

## Editing

`modifiers` is not a semantically closed field: for some URLs it holds more than operations, and replacing it throws that away. Read this before the recipes.

::: danger Replacing or clearing `modifiers` can destroy the URL
Appending is always safe. Replacing or clearing is not, because `modifiers` sometimes holds more than operations.

The case that bites inside this API's own contract is a **conversion result**. It _is_ a file URL — `isFileUrl` returns `true` for it — so a kind check does not save you, and its prefix lives in `modifiers`:

```ts
const conversion = tinyParse(
  'https://ucarecdn.com/:uuid/gif2video/-/format/webm/'
)
tinyBuild({ ...conversion, modifiers: modifiers('preview/800x600') })
// → https://ucarecdn.com/:uuid/-/preview/800x600/   ← no longer a video
```

[Other URL kinds](#other-url-kinds) fail the same way, for the same reason, which is why they are out of scope. All of it fails silently — no throw, no type error.
:::

::: warning Any edit invalidates a secure-delivery token
A `?token=…` signature covers the path, so it survives in `search` and stops matching as soon as `modifiers` changes — appending included. The URL looks right and is rejected at delivery. Re-sign after editing; this library does not sign, so that happens wherever your signatures are issued. Dropping `search` only works if the project does not enforce signed delivery, and it discards any other query parameters with the token.
:::

With those understood:

```ts
import {
  joinModifiers,
  modifiers,
  tinyBuild,
  tinyParse
} from '@uploadcare/cdn-url/tiny'

const stored =
  'https://ucarecdn.com/:uuid/-/preview/photo.jpg?token=exp=1~hmac=b79f'
const parts = tinyParse(stored) // search: '?token=exp=1~hmac=b79f'

// append — safe for conversions and group elements, still breaks the token
tinyBuild({
  ...parts,
  modifiers: joinModifiers(parts.modifiers, modifiers('blur/10'))
})
// → https://ucarecdn.com/:uuid/-/preview/-/blur/10/photo.jpg?token=exp=1~hmac=b79f

// replace the whole chain — see the danger note above
tinyBuild({ ...parts, modifiers: modifiers('preview/800x600') })

// strip every operation — likewise
tinyBuild({ ...parts, modifiers: undefined })
// → https://ucarecdn.com/:uuid/photo.jpg?token=exp=1~hmac=b79f
```

Omitting `modifiers`, passing `undefined` and passing `modifiers()` all produce the same empty chain.

There is no `replace` or `without` at this level, so appending an operation the chain already has leaves both:

```ts
const twice = tinyParse('https://ucarecdn.com/:uuid/-/blur/5/photo.jpg')
tinyBuild({
  ...twice,
  modifiers: joinModifiers(twice.modifiers, modifiers('blur/10'))
})
// → …/-/blur/5/-/blur/10/photo.jpg — the CDN applies the last one
```

That is usually harmless, since the CDN takes the last occurrence of a non-stackable operation, but it grows the URL every time. When you need real replacement, move up to [`CdnUrl.replace`](/reference/builder/classes/CdnUrl#replace) or rebuild the chain from operations.

## The chain type is nominal

A chain is not an ordinary `string` to the type checker. It is a `ModifiersChain`, which the library's own functions produce:

```ts
import {
  normalizeModifiers,
  tinyBuild,
  tinyParse
} from '@uploadcare/cdn-url/tiny'

const parts = tinyParse('https://ucarecdn.com/:uuid/photo.jpg')

tinyBuild({ ...parts, modifiers: '-/resize/300x/' }) // ✗ type error
tinyBuild({ ...parts, modifiers: normalizeModifiers('-/resize/300x/') }) // ✓
```

Producers are `modifiers()`, `normalizeModifiers()`, `joinModifiers()` and `tinyParse`. The brand costs nothing at run time — the value is an ordinary string — and it exists because the obvious alternative rules out almost nothing: a pattern type like `` `${string}/` `` is satisfied by any string ending in a slash. Like every TypeScript brand it is a convention, not a lock: a cast produces one too, so it stops accidents rather than determined callers.

Only `modifiers` is branded; the other fields are ordinary strings. Concatenation goes through `joinModifiers`, since a template literal would widen the result back to `string`.

## Moving up to the full API

A chain is an ordinary string at run time, in the format the rest of the library speaks, so both directions are one call:

```ts
import { parseOperations, serializeOperations } from '@uploadcare/cdn-url'
import { normalizeModifiers, tinyParse } from '@uploadcare/cdn-url/tiny'

// string level → operations
const parts = tinyParse('https://ucarecdn.com/:uuid/-/resize/300x/-/blur/10/')
parseOperations(parts.modifiers)
// → [{ name: 'resize', params: ['300x'] }, { name: 'blur', params: ['10'] }]

// operations → string level
const ops = [{ name: 'preview', params: ['800x600'] }]
normalizeModifiers(serializeOperations(ops)) // → '-/preview/800x600/'
```

[`serializeOperations`](/reference/index/functions/serializeOperations) returns a plain string, so it needs `normalizeModifiers` to become a `ModifiersChain` again — the one call that bridges the two.

From the operation array you have the full model: [`validateOperations`](/reference/validate/functions/validateOperations) for diagnostics, [`operationInputs`](/reference/validate/functions/operationInputs) for order-dependent relationships. From a URL you built at the string level, `parseFileUrl(tinyBuild(parts))` re-enters the typed model.
