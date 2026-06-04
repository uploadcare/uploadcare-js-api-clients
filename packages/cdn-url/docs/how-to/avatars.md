# Avatars

The avatar problem: arbitrary user photos in, consistent squares (or circles) out — faces centered, small files.

## The recipe

```ts
import { serializeCdnUrl } from '@uploadcare/cdn-url'
import {
  borderRadius,
  format,
  quality,
  scaleCrop
} from '@uploadcare/cdn-url/ops'

function avatarUrl(uuid: string, size: number): string {
  return serializeCdnUrl({
    origin: 'https://ucarecdn.com',
    uuid,
    operations: [
      scaleCrop(size, size, { type: 'smart_faces_objects' }),
      borderRadius('50p')
    ]
  })
}

avatarUrl(uuid, 96)
// → …/-/scale_crop/96x96/smart_faces_objects/-/border_radius/50p/
```

What each piece does:

- **`scaleCrop(size, size, { type })`** — scales down and crops to an exact square. The smart types run content detection as a fallback chain: `smart_faces_objects` tries faces first, then salient objects, then sensible defaults. `'smart'` is the full detection chain; narrower variants like `'smart_faces'` pick specific detectors — see [`SCALE_CROP_TYPES`](/reference/ops/variables/SCALE_CROP_TYPES) for the complete list. Plain `scaleCrop(size, size, { align: 'center' })` skips detection entirely.
- **`borderRadius('50p')`** — circle crop on the CDN. Skip it if you round corners in CSS (cheaper to change later, works with transparent hover states).
- Format negotiation (`format/auto`) and adaptive quality apply **automatically** once the chain has a processing operation — no extra ops needed ([Best practices](/best-practices)).

## Tighter face crops

`scaleCrop` smart types keep context around the face. For a tight head-and-shoulders crop, lead with an object-aware crop, then size it:

```ts
import { cropByTag, scaleCrop } from '@uploadcare/cdn-url/ops'

const ops = [
  cropByTag('face', { ratio: '1:1' }), // square region around the detected face
  scaleCrop(96, 96)
]
```

Remember operations are a pipeline — the `scaleCrop` here only resizes, because the `crop` already chose the region.

## Retina variants

Avatars are fixed-size, so density descriptors fit naturally — see [Responsive images](/how-to/responsive-images#pixel-density-variants):

```html
<img
  src="{avatarUrl(uuid,"
  96)}
  srcset="{`${avatarUrl(uuid"
  192)}
  2x`}
  width="96"
  height="96"
  alt="{name}"
/>
```

## Fallback for missing photos

`scaleCrop` smart types need a processable image. If the row might reference a deleted file, wrap rendering with an `onerror` fallback or pre-validate the uuid server-side — the URL itself is always well-formed, but the CDN returns 404 for missing files.
