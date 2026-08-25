# Redact faces & strip metadata

Two different privacy problems, two unrelated operations, and one thing worth understanding before you ship either: **the original file is still there.**

Blurring a region and stripping EXIF happen on the delivered derivative. The URL without those operations still serves the untouched original to anyone who can construct it — and constructing it means deleting a few characters. If the requirement is that nobody can ever see the unredacted image, this page is the wrong tool: delete or replace the file through the REST API, or serve it behind [signed URLs](https://uploadcare.com/docs/security/secure-delivery/).

With that said.

## Blur faces the CDN detects

```ts
myCdn.file(uuid).blurRegion({ faces: true }).href
// → …/-/blur_region/faces/
```

Detection is the CDN's, so results vary with the image: a profile, a partially covered face or a face in a crowd may be missed. Treat it as best-effort, and never as a compliance control.

## Blur a rectangle you chose

When you know where the sensitive area is — a licence plate, an address on a form, a name badge — give explicit geometry:

::: code-group

```ts [Atomic]
import { serializeCdnUrl } from '@uploadcare/cdn-url'
import { blurRegion } from '@uploadcare/cdn-url/ops'

serializeCdnUrl({
  cdnBase,
  uuid,
  operations: [blurRegion({ width: 100, height: 50, x: 10, y: 20 })]
})
// → …/-/blur_region/100x50/10,20/
```

```ts [Builder]
new CdnUrl({ cdnBase, uuid }).with(
  blurRegion({ width: 100, height: 50, x: 10, y: 20 })
).href
```

```ts [Fluent]
myCdn.file(uuid).blurRegion({ width: 100, height: 50, x: 10, y: 20 }).href
```

:::

Dimensions and offsets take pixels or percentages. Percentages are the safer choice when the same region is applied to differently sized sources, since a pixel rectangle computed for a 4000px original lands somewhere else entirely on a 800px one.

Strength is optional and defaults to 10 at the CDN:

```ts
blurRegion({ width: '30p', height: '20p', x: '10p', y: '15p', strength: 250 })
```

Raise it until the region is genuinely unreadable. A gentle blur on text is reversible-looking enough to fail its purpose — and on small type, still legible.

## Strip EXIF and GPS

`strip_meta` is a separate operation and does not blur anything:

```ts
myCdn.file(uuid).stripMeta('sensitive').href
// → …/-/strip_meta/sensitive/
```

`'sensitive'` drops GPS coordinates and other personally identifying tags while keeping orientation and colour profile — which is what you want, because dropping orientation rotates photos and dropping the profile shifts colours. `'all'` removes everything, `'none'` keeps everything.

The two compose in either order, since neither configures the other:

```ts
const scrubbed = [blurRegion({ faces: true }), stripMeta('sensitive')]
// → -/blur_region/faces/-/strip_meta/sensitive/
```

## What this does not do

**It does not remove metadata from the original.** Same point as above: `strip_meta` affects the derivative the CDN returns.

**It does not survive a re-crop by someone else.** A URL is a public recipe. Anyone holding the redacted URL can edit the chain — that is the whole premise of this library — and they can delete `blur_region` as easily as you added it. If that matters, sign your URLs so an edited path fails verification, and read [the token hazard](/guide/cdn-base#things-that-bite): editing a signed URL invalidates it, which is exactly the property you want here.

**`blur_region` combined with a chain-wide `blur` is unmodelled.** The public docs do not describe how the two interact, so `validateOperations` says nothing about it and neither will this page. Check the output.

## Related

- [Text & watermarks](/how-to/text-and-watermarks) — the other way to alter what an image shows
- [Signed URLs](https://uploadcare.com/docs/security/secure-delivery/) on uploadcare.com
- [`strip_meta` reference](https://uploadcare.com/docs/transformations/image/#operation-strip-meta)
