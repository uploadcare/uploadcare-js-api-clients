# Best practices

Patterns proven across Uploadcare's own products. The overarching rule: **the CDN does the heavy lifting once you give it one processing operation** — most of the rest is overrides.

## One core operation unlocks the defaults

The CDN only processes an image when the chain contains `preview`, `resize`, `smart_resize` or `scale_crop`. Without one, the **original file is delivered untouched** — silently. With one, two powerful defaults kick in:

- **`format/auto` is applied by default** — AVIF/WebP negotiation with the client, PNG for alpha/artwork, JPEG otherwise. No need to add `format('auto')` yourself.
- **Adaptive quality** — content-aware compression — is enabled by default for projects created on or after August 4, 2025 (older projects: enable it under Delivery settings in the dashboard).

So the canonical thumbnail chain is just:

```ts
const ops = [preview(400, 400)]
```

Bare `preview()` exists exactly to trigger processing without resizing:

```ts
// ❌ no core operation — delivered as the original, nothing applies
const broken = [stripMeta('sensitive')]

// ✅ processed: format/auto + adaptive quality + the strip
const processed = [preview(), stripMeta('sensitive')]
```

[`validateOperations`](/how-to/validate-user-input) flags the broken case as `no-core-operation`.

::: tip When to be explicit anyway

- `format(…)` — to force a specific output (`preserve` for downloads, `jpeg` to unlock the 5000px ceiling), or when serving from S3-bypass storage where `auto` doesn't apply.
- `quality(…)` — on projects **created before August 4, 2025** with adaptive quality not enabled, or to override the adaptive choice (see high-DPR below).
- `progressive(true)` — affects only the JPEG fallback path (it never forces JPEG); worth it for large hero images on slow connections, noise elsewhere.
  :::

## High pixel ratios: bigger and lighter

For 2x+ screens, increase resolution and _decrease_ quality — sharper on retina at roughly the same bytes. This is the one case where an explicit `quality` override earns its place:

```ts
// browser-only: devicePixelRatio is a window global — guard it in SSR
const ops =
  devicePixelRatio >= 2
    ? [preview(800, 800), quality('lightest')]
    : [preview(400, 400)]
```

## Choosing a sizing operation

| You want                                        | Use                                  |
| ----------------------------------------------- | ------------------------------------ |
| Fit inside a box, keep ratio, never crop        | `preview(w, h)`                      |
| Exact width, height follows ratio               | `resize({ width })`                  |
| Exact both dimensions, cover & crop             | `scaleCrop(w, h, { type: 'smart' })` |
| Exact both dimensions, content-aware generation | `smartResize(w, h)`                  |

When in doubt: `preview` for content images, `scaleCrop` for fixed slots (cards, avatars, banners).

## Respect the dimension ceilings

Output is capped at **3000×3000**, or **5000×5000 when `format('jpeg')`** is in the chain. Cap your DPR math:

```ts
const size = Math.min(Math.ceil(cssSize * devicePixelRatio), 3000)
```

Oversized requests fail at the CDN — and `validateOperations` flags them before that.

## Don't upscale

`preview` never upscales, `resize` does when the source is smaller. If you use `resize` with user-provided sources, lead with `stretch('off')` — blurry upscaled images are worse than smaller crisp ones:

```ts
const ops = [stretch('off'), resize({ width: 1920 })]
```

## Strip metadata deliberately

EXIF (including GPS positions) survives by default on originals. For user-generated content shown publicly, strip it:

```ts
import { stripMeta } from '@uploadcare/cdn-url/ops'

const ops = [preview(1280, 1280), stripMeta('sensitive')]
```

`'sensitive'` keeps harmless fields (orientation, color profile) and drops locations and serial numbers; `'all'` removes everything.

## Cache the strings, not the work

URL building is pure string assembly — microseconds. But the _first request_ for each unique URL is a CDN cache miss that runs the pipeline. Prefer a small set of canonical sizes (`[320, 640, 960, 1280, 1920]`) over arbitrary per-layout values, so your users keep hitting warm caches.
