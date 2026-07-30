# Text & watermarks

Two ways to mark an image: overlay another file on top of it, or draw text into it. Both are ordinary chain operations.

One thing to settle first: **text overlays are off until Uploadcare enables them for your project** — [contact sales](https://uploadcare.com/docs/transformations/image/overlay/#overlay-text) to switch them on, since arbitrary text on images invites misuse. The library will happily build a `-/text/…` URL for a project that has not enabled them; the CDN is what refuses it. Watermarks by `overlay` need no such switch.

Every snippet below assumes these bindings:

```ts
import { serializeCdnUrl } from '@uploadcare/cdn-url'
import { CdnUrl } from '@uploadcare/cdn-url/builder'
import { cdn, prefixedCdnBase } from '@uploadcare/cdn-url/fluent'
import {
  font,
  overlay,
  preview,
  text,
  textAlign,
  textBox
} from '@uploadcare/cdn-url/ops'

const uuid = 'c2499162-eb07-4b93-b31e-94a89a47e858'
const logoUuid = '1bac376c-aa7e-4356-861b-dd2ee0d3f45b'
const cdnBase = prefixedCdnBase('demopublickey') // your CDN base
const myCdn = cdn.base(cdnBase)
```

A `p` suffix means percent throughout — `'20p'` is 20% of the base image, and a bare number is pixels.

## Watermark another image on top

`overlay` takes a uuid — or `'self'` for the image itself — plus size, position and opacity:

::: code-group

```ts [Atomic]
serializeCdnUrl({
  cdnBase,
  uuid,
  operations: [
    preview(1200, 800),
    overlay(logoUuid, {
      size: ['20p', '20p'],
      position: ['90p', '90p'],
      opacity: '60p'
    })
  ]
})
// → …/-/preview/1200x800/-/overlay/:logoUuid/20px20p/90p,90p/60p/
```

```ts [Builder]
new CdnUrl({ cdnBase, uuid }).with(
  preview(1200, 800),
  overlay(logoUuid, {
    size: ['20p', '20p'],
    position: ['90p', '90p'],
    opacity: '60p'
  })
).href
```

```ts [Fluent]
import { cdn, prefixedCdnBase } from '@uploadcare/cdn-url/fluent'

const myCdn = cdn.base(prefixedCdnBase('demopublickey'))

myCdn
  .file(uuid)
  .preview(1200, 800)
  .overlay(logoUuid, {
    size: ['20p', '20p'],
    position: ['90p', '90p'],
    opacity: '60p'
  }).href
```

:::

Position is either an offset pair or one of five keywords — `center`, `top`, `right`, `bottom`, `left`. There is no `'se'` or `'bottom-right'`, so a corner needs offsets.

Percentage offsets behave like [CSS `background-position`](https://developer.mozilla.org/docs/Web/CSS/background-position): they distribute the _leftover_ space rather than setting the mark's top-left corner, so the overlay never overflows. `['100p', '100p']` sits flush in the bottom-right, `['90p', '90p']` leaves a 10% margin, `['50p', '50p']` centres. Pixel offsets are absolute from the top-left.

Size percentages are relative to the base image, so a `20p` mark stays proportional at every width in a `srcset`.

The three options are positional at the CDN, so **`position` requires `size`, and `opacity` requires `position`.** There is no way to set opacity alone, and no value meaning "the mark's own size" — the CDN scales an overlay relative to the base image and defaults to 100% of it, so pass the size you want.

Omitting a middle option shifts the rest into the wrong slots. Development builds throw `overlay position/opacity require a size (params are ordered)`; production builds strip that check and emit `-/overlay/:uuid/60p/`, with the opacity sitting in the size slot for the CDN to reject. Which bundle you get is decided by [export conditions](/guide/bundles), not by the environment name: a test runner that resolves `production` will not throw. If you are unsure which yours resolves, assert that a knowingly-bad call throws.

Overlays stack in chain order, so the last one is on top:

```ts
const stacked = [
  overlay(logoUuid, { size: ['20p', '20p'], position: ['90p', '90p'] }),
  overlay(badgeUuid, { size: ['10p', '10p'], position: 'top' })
]
// → -/overlay/:logoUuid/20px20p/90p,90p/-/overlay/:badgeUuid/10px10p/top/
```

`'self'` overlays the image on itself, which is how you fake a blurred-edge fill:

```ts
const framed = [
  preview(800, 800),
  overlay('self', {
    size: ['100p', '100p'],
    position: 'center',
    opacity: '30p'
  })
]
```

## Draw text into the image

`text` takes the **box** it draws into (size, then position — same coordinate rules as above), and the string. The box governs wrapping and how `textAlign` positions the copy inside it. `font` sets size and colour (the CDN also accepts weight, style and family); `textAlign` takes horizontal then vertical; `textBox` draws a background behind the text — mode, colour, padding.

Escaping is handled for you — slashes, newlines and tildes are encoded per the CDN's `~s`/`~n`/`~~` rules, so a caption can contain a URL:

::: code-group

```ts [Atomic]
serializeCdnUrl({
  cdnBase,
  uuid,
  operations: [
    preview(1200, 630),
    font(48, 'ffffff'),
    textAlign('center', 'bottom'),
    textBox('fill', '00000080', 20),
    text(['80p', '30p'], 'bottom', 'Ship it on Friday')
  ]
})
```

```ts [Builder]
new CdnUrl({ cdnBase, uuid }).with(
  preview(1200, 630),
  font(48, 'ffffff'),
  textAlign('center', 'bottom'),
  textBox('fill', '00000080', 20),
  text(['80p', '30p'], 'bottom', 'Ship it on Friday')
).href
```

```ts [Fluent]
myCdn
  .file(uuid)
  .preview(1200, 630)
  .font(48, 'ffffff')
  .textAlign('center', 'bottom')
  .textBox('fill', '00000080', 20)
  .text(['80p', '30p'], 'bottom', 'Ship it on Friday').href
```

:::

Note what escaping is _not_: percent-encoding. A space stays a space in the path, which browsers encode on request but an HTTP header or JSON payload will not — encode there yourself.

Prefer the operation creators over [string-level literals](/guide/string-level-api) here. Caption text is the one operation parameter that usually comes from user input, and the creators are what escape it; a hand-written `modifiers('text/80px30p/bottom/…')` puts you in charge of that.

## The part that fails silently

`font`, `textAlign` and `textBox` are not standalone effects. They are **state for the `text` that follows them**, and the nearest one wins:

```
-/font/48/ffffff/-/text_align/center/bottom/-/text/80px30p/bottom/Hello/
└──────────────── configure ────────────────┘└──────── the target ──────┘
```

Move the `text` before them, or drop it while keeping them, and the CDN renders unstyled text or nothing at all — with no error. Nothing in the URL looks wrong.

Two ways to check. Ask what configures a given operation:

```ts
import { operationInputs } from '@uploadcare/cdn-url/validate'

operationInputs(operations, 'text').map((edge) => edge.operation.name)
// → ['font', 'text_align', 'text_box']
```

Or validate the whole chain and look for orphans:

```ts
import { validateOperations } from '@uploadcare/cdn-url/validate'

validateOperations([font(48), preview(800, 600)])
// → [{ severity: 'warning', code: 'modifier-without-target', … }]
```

`modifier-without-target` is exactly this bug: a modifier with no `text` after it. Run it in development or in a test; see [Validate user input](/how-to/validate-user-input) for wiring it in.

The same trap applies when you **edit** a stored URL. Appending `text` after an existing chain picks up whatever `font` happens to precede it, and reordering operations can separate a modifier from its target. If you reorder, re-check with `operationInputs`.

## What is not modelled

Overlay **z-order beyond chain order** and the interaction between `blur_region` and a chain-wide `blur` are not described in the public CDN docs, so this library does not model them and `validateOperations` will not warn about them. If a stack composites differently than you expect, check it against [the operation reference](https://uploadcare.com/docs/transformations/image/overlay/).

## Related

- [Redact faces and regions](/how-to/redact-and-strip-metadata) — `blur_region` and stripping EXIF
- [Validate user input](/how-to/validate-user-input) — the diagnostics behind `modifier-without-target`
- [Overlay reference](https://uploadcare.com/docs/transformations/image/overlay/) on uploadcare.com
