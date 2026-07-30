# Responsive images

Serve each device the pixels it actually needs: a `srcset` of CDN-resized variants plus DPR-aware quality. There is no image build pipeline, because every variant is just a URL.

## Width-based srcset

::: code-group

```ts [Atomic]
import { serializeCdnUrl } from '@uploadcare/cdn-url'
import { preview } from '@uploadcare/cdn-url/ops'

const WIDTHS = [320, 640, 960, 1280, 1920]

function variant(uuid: string, width: number): string {
  return serializeCdnUrl({
    cdnBase: 'https://1s4oyld5dc.ucarecd.net',
    uuid,
    operations: [preview(width, width)]
  })
}

const srcset = WIDTHS.map((w) => `${variant(uuid, w)} ${w}w`).join(', ')
```

```ts [Builder]
import { CdnUrl } from '@uploadcare/cdn-url/builder'
import { preview } from '@uploadcare/cdn-url/ops'

const WIDTHS = [320, 640, 960, 1280, 1920]

function variant(uuid: string, width: number): string {
  return new CdnUrl({
    cdnBase: 'https://1s4oyld5dc.ucarecd.net',
    uuid,
    operations: [preview(width, width)]
  }).href
}

const srcset = WIDTHS.map((w) => `${variant(uuid, w)} ${w}w`).join(', ')
```

```ts [Fluent]
import { base, prefixedCdnBase } from '@uploadcare/cdn-url/fluent'

const cdn = base(prefixedCdnBase('demopublickey'))
const WIDTHS = [320, 640, 960, 1280, 1920]

function variant(uuid: string, width: number): string {
  return cdn.file(uuid).preview(width, width).href
}

const srcset = WIDTHS.map((w) => `${variant(uuid, w)} ${w}w`).join(', ')
```

:::

The `preview` alone is enough. Once a chain contains a processing operation,
the CDN defaults to `format/auto` (AVIF/WebP negotiation) and applies adaptive
quality automatically. See [Best practices](/best-practices) for when explicit
`format`/`quality`/`progressive` overrides still earn their place.

```html
<img
  :src="variant(uuid, 960)"
  :srcset="srcset"
  sizes="(max-width: 640px) 100vw, 640px"
  alt="…"
/>
```

`preview(w, w)` downscales proportionally to fit. It never crops and never upscales, so one operation covers both landscape and portrait sources.

## Pixel-density variants

For fixed-size images (logos, avatars), density descriptors are simpler than widths:

```ts
const src1x = variant(uuid, 200)
const src2x = variant(uuid, 400)
```

```html
<img src="…200…" srcset="…400… 2x" width="200" height="200" alt="…" />
```

On high-DPR screens the extra pixels hide compression artifacts, so an explicit `quality('lightest')` override on the 2x variant typically looks identical to the adaptive default and saves real bytes. See [Best practices](/best-practices#high-pixel-ratios-bigger-and-lighter).

## Computing sizes at runtime

When you measure the layout instead of hardcoding widths, scale by `devicePixelRatio` and respect the CDN output ceiling:

```ts
const MAX_DIMENSION = 3000 // 5000 with format('jpeg')

function fitted(cssWidth: number): number {
  return Math.min(
    Math.ceil(cssWidth * Math.max(devicePixelRatio, 1)),
    MAX_DIMENSION
  )
}
```

## Or let the components do it

[`<uc-img>` adaptive delivery](https://uploadcare.com/docs/adaptive-delivery/) generates `srcset` automatically from layout, including lazy loading and placeholders. Reach for this library when you need URLs outside an `<img>` tag: Open Graph images, emails, canvas, server-rendered markup.
