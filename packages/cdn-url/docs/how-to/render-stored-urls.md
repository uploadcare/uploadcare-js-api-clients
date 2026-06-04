# Render stored URLs

You upload images, your users edit them with the [cloud image editor](https://uploadcare.com/docs/file-uploader/image-editor/), and you store the result in your database. Later you need to render that image somewhere else — as a 400×400 thumbnail in a list, a hero banner, an `srcset`. The stored URL already carries the user's edits; you just need to add sizing on top.

## Why not string concatenation

The obvious approach breaks in non-obvious ways:

```ts
// ❌ Looks fine, breaks in production
const thumb = `${stored}-/preview/400x400/`
```

| Stored value                      | Result                                           |
| --------------------------------- | ------------------------------------------------ |
| `…/uuid/`                         | ✅ works — by luck                               |
| `…/uuid` (no trailing slash)      | ❌ `…/uuid-/preview/400x400/` — broken path      |
| `…/uuid/-/crop/640x480/photo.jpg` | ❌ ops appended **after the filename** — ignored |
| `…/uuid/?token=exp=…`             | ❌ ops appended after the query string — broken  |

Regex patching has the same problem from the other direction:

```ts
// ❌ Drops the user's edits along with the old sizing
const thumb = stored.replace(/-\/.*$/, '-/preview/400x400/')
```

`parseCdnUrl` decomposes any CDN URL flavor into a plain object; `serializeCdnUrl` puts it back together. Everything between them is ordinary array and object manipulation.

## What's in your database?

Depending on how you saved the editor output, you have one of three shapes. All three end in the same place — an `operations` array you can extend.

### A full CDN URL

```ts
import { parseCdnUrl, serializeCdnUrl } from '@uploadcare/cdn-url'
import { preview } from '@uploadcare/cdn-url/ops'

const stored = 'https://ucarecdn.com/:uuid/-/crop/640x480/130,80/photo.jpg'

const parsed = parseCdnUrl(stored)
const thumb = serializeCdnUrl({
  ...parsed,
  operations: [...parsed.operations, preview(400, 400)]
})
// → https://ucarecdn.com/:uuid/-/crop/640x480/130,80/-/preview/400x400/photo.jpg
```

The user's crop stays. The filename stays at the end, where the CDN expects it.

### A uuid only

No parsing needed — build from scratch:

```ts
import { serializeCdnUrl } from '@uploadcare/cdn-url'
import { preview } from '@uploadcare/cdn-url/ops'

const thumb = serializeCdnUrl({
  origin: 'https://ucarecdn.com',
  uuid: row.uuid,
  operations: [preview(400, 400)]
})
```

### A uuid + modifiers string

Some integrations store the modifiers string (the uploader calls it `cdnUrlModifiers`, e.g. `'-/crop/640x480/130,80/'`) in its own column — `row.modifiers` below. `parseOperations` turns it back into an array:

```ts
import { parseOperations, serializeCdnUrl } from '@uploadcare/cdn-url'
import { preview } from '@uploadcare/cdn-url/ops'

const thumb = serializeCdnUrl({
  origin: 'https://ucarecdn.com',
  uuid: row.uuid,
  operations: [...parseOperations(row.modifiers), preview(400, 400)]
})
```

## Append vs replace

Operations form a sequential pipeline, and **order matters**: appending `preview` _after_ the stored `crop` resizes the cropped result — which is almost always what you want. Appending it _before_ would crop the resized image instead.

For non-repeatable operations (`quality`, `format`, …) the CDN applies the **last occurrence** when the same one appears twice; sizing operations genuinely stack as pipeline steps. Appending a second `quality` works, but the URL carries dead weight — and a second `resize` after a `preview` chain can produce surprising sizes. When the stored URL may already contain the operation you're adding, replace instead of append:

```ts
const withoutSizing = parsed.operations.filter(
  (op) => op.name !== 'preview' && op.name !== 'resize'
)
const thumb = serializeCdnUrl({
  ...parsed,
  operations: [...withoutSizing, preview(400, 400)]
})
```

To catch accidental duplicates during development, run the chain through [`validateOperations`](/how-to/validate-user-input) — duplicates surface as `duplicate-operation` warnings.

## Rebasing onto another domain

Stored URLs often point at the legacy `ucarecdn.com` while your project now serves from a [prefixed or custom domain](https://uploadcare.com/docs/delivery/cdn/) — one you've already configured in your project settings; the library only writes the string. The origin is just a field:

```ts
const rebased = serializeCdnUrl({
  ...parseCdnUrl(stored),
  origin: 'https://cdn.example.com' // your CNAME, or https://<prefix>.ucarecd.net
})
```

Everything else — uuid, the user's edits, the filename — survives untouched.

## A taste of srcset

Generating width variants is a `map`:

```ts
const widths = [320, 640, 1280]

const srcset = widths
  .map((w) => {
    const url = serializeCdnUrl({
      ...parsed,
      operations: [...parsed.operations, preview(w, w)]
    })
    return `${url} ${w}w`
  })
  .join(', ')
```

See [Responsive images](/how-to/responsive-images) for the full treatment — or skip the manual work entirely with [`<uc-img>` adaptive delivery](https://uploadcare.com/docs/adaptive-delivery/), which generates the variants for you.

::: warning Signed URLs
If your project uses [secure delivery](https://uploadcare.com/docs/security/secure-delivery/), stored URLs may carry `?token=…`. Parsing preserves the token — but appending operations **changes the path the signature was computed for**, so the CDN rejects the modified URL with the old token. Re-sign it before serving.
:::

## Defensive parsing

Database rows lie. `parseCdnUrl` throws a `TypeError` on anything that isn't a CDN URL — in both the development and production bundles, since this is structural, not validation:

```ts
function tryParse(stored: string) {
  try {
    return parseCdnUrl(stored)
  } catch {
    return null // log it, render a placeholder, fix the row
  }
}
```

If your table can also contain group URLs, narrow by `kind` before touching `uuid`:

```ts
const parsed = parseCdnUrl(stored)

switch (parsed.kind) {
  case 'file':
    return renderThumb(parsed)
  case 'group':
    return renderGallery(parsed.group)
  default:
    return renderFallback()
}
```

## Putting it together

A thumbnail grid from a list of rows, handling all three storage shapes:

```ts
import {
  parseCdnUrl,
  parseOperations,
  serializeCdnUrl
} from '@uploadcare/cdn-url'
import { preview } from '@uploadcare/cdn-url/ops'

const THUMB = [preview(400, 400)]

function thumbUrl(row: ImageRow): string | null {
  try {
    if (row.cdnUrl) {
      const parsed = parseCdnUrl(row.cdnUrl)
      if (parsed.kind !== 'file') return null
      return serializeCdnUrl({
        ...parsed,
        operations: [...parsed.operations, ...THUMB]
      })
    }
    return serializeCdnUrl({
      origin: 'https://ucarecdn.com',
      uuid: row.uuid,
      operations: [...parseOperations(row.modifiers ?? ''), ...THUMB]
    })
  } catch {
    return null
  }
}
```

```tsx
{
  rows.map((row) => {
    const src = thumbUrl(row)
    return src ? (
      <img key={row.id} src={src} width={400} height={400} alt={row.alt} />
    ) : null
  })
}
```
