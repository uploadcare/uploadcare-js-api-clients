# Responsive images

Serve each device the pixels it actually needs: a `srcset` of CDN-resized variants plus DPR-aware quality. No image build pipeline — every variant is just a URL.

## Width-based srcset

```ts
import { serializeCdnUrl } from '@uploadcare/cdn-url'
import { format, preview, quality } from '@uploadcare/cdn-url/ops'

const WIDTHS = [320, 640, 960, 1280, 1920]

function variant(uuid: string, width: number): string {
  return serializeCdnUrl({
    origin: 'https://ucarecdn.com',
    uuid,
    operations: [preview(width, width)]
  })
}

const srcset = WIDTHS.map((w) => `${variant(uuid, w)} ${w}w`).join(', ')
```

The `preview` alone is enough — once a chain contains a processing operation,
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

`preview(w, w)` downscales proportionally to fit — it never crops and never upscales, so one operation covers both landscape and portrait sources.

## Pixel-density variants

For fixed-size images (logos, avatars), density descriptors are simpler than widths:

```ts
const src1x = variant(uuid, 200)
const src2x = variant(uuid, 400)
```

```html
<img src="…200…" srcset="…400… 2x" width="200" height="200" alt="…" />
```

On high-DPR screens the extra pixels hide compression artifacts — an explicit `quality('lightest')` override on the 2x variant typically looks identical to the adaptive default and saves real bytes. See [Best practices](/best-practices#high-pixel-ratios-bigger-and-lighter).

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

[`<uc-img>` adaptive delivery](https://uploadcare.com/docs/adaptive-delivery/) generates `srcset` automatically from layout, including lazy loading and placeholders. Reach for this library when you need URLs outside an `<img>` tag — Open Graph images, emails, canvas, server-rendered markup.
