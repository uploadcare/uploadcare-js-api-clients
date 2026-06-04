# Video & documents

Video and document conversion are **asynchronous REST jobs**, not on-the-fly URL transformations. This library builds the _paths_ you submit to the convert API — `gif2video` is the exception, served directly from a URL.

## Video conversion paths

`videoPath` produces the domain-less string `POST /convert/video/` expects:

```ts
import {
  cut,
  format,
  quality,
  size,
  thumbs,
  videoPath
} from '@uploadcare/cdn-url/video'

videoPath(uuid, [
  size({ width: 720, height: 540 }),
  format('webm'),
  quality('better'),
  cut('0:0:10.0', '30.0'),
  thumbs(5)
])
// → /:uuid/video/-/size/720x540/-/format/webm/-/quality/better/-/cut/0:0:10.0/30.0/-/thumbs~5/
```

Grammar the creators enforce (in development):

- `size` dimensions must be **divisible by 4**; output is downscale-only
- `cut` takes `H:MM:SS.sss`-style timestamps (zero-padding optional) or plain seconds, and `'end'` as the length
- `thumbs(n)` accepts 1–50 and must be the **last** operation

Submit with [`@uploadcare/rest-client`](https://github.com/uploadcare/uploadcare-js-api-clients/tree/main/packages/rest-client):

```ts
import { convertVideo } from '@uploadcare/rest-client'

await convertVideo(
  { paths: [videoPath(uuid, ops)], store: true },
  { authSchema }
)
```

The job produces a new uuid for the converted file (plus thumbnails). Finished results are also addressable on the CDN as `https://…/:uuid/video/-/…/` — which is why `parseCdnUrl` understands the `video` prefix inside full URLs.

## Document conversion paths

Same model, `documentPath`:

```ts
import { documentPath, format, page } from '@uploadcare/cdn-url/document'

documentPath(uuid, [format('pdf')])
// → /:uuid/document/-/format/pdf/

documentPath(uuid, [format('jpg'), page(2)])
// → /:uuid/document/-/format/jpg/-/page/2/
```

`page` is 1-based and only valid when the target format is `jpg` or `png`.

## gif2video — the on-the-fly exception

Animated GIFs convert to video **directly on the CDN**, no REST job:

```ts
import { format, gif2videoUrl, quality } from '@uploadcare/cdn-url/gif2video'

gif2videoUrl('https://ucarecdn.com', uuid, [format('webm'), quality('better')])
// → https://ucarecdn.com/:uuid/gif2video/-/format/webm/-/quality/better/
```

```html
<video autoplay loop muted playsinline :src="gif2videoUrl(…)" />
```

Note the URL shape: the `gif2video` prefix attaches right after the uuid with a plain `/` — no `-/` separator. The source file must be an animated image, otherwise the CDN responds `400`.
