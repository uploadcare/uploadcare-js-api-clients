# CDN URL anatomy

Every Uploadcare CDN URL follows one structure. Understanding it makes the parser's output — and the rest of this library — obvious.

## A file URL

```
https://ucarecdn.com/c2499162-…-47e858/-/crop/640x480/-/preview/400x400/photo.jpg
└──────┬───────────┘└─────┬───────────┘└──────────┬──────────────────┘└───┬────┘
     origin              uuid                operations               filename
```

- **origin** — scheme + host, no path
- **uuid** — the file id
- **operations** — zero or more `-/name/params/` directives, applied **in order** as a pipeline
- **filename** — optional; anything after the last operation without a trailing slash

`parseCdnUrl` returns exactly these fields, discriminated by `kind`:

```ts
const parsed = parseCdnUrl(url)
// parsed.kind: 'file' | 'group' | 'group-element' | 'proxy'
```

The shape only has the fields its kind allows — TypeScript narrows on `kind`:

| `kind`          | Fields                                                           |
| --------------- | ---------------------------------------------------------------- |
| `file`          | `uuid`, `conversion`, `operations`, `filename`, `search`, `hash` |
| `group`         | `group: { uuid, count }` — no operations, by CDN design          |
| `group-element` | `group`, `nth`, `operations`, `filename`, `search`, `hash`       |
| `proxy`         | `sourceUrl`, `operations` — the source keeps its own query/hash  |

All kinds carry `origin`.

## Domains

| Kind       | Host                   | Notes                                                                                                                       |
| ---------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `legacy`   | `ucarecdn.com`         | the original shared domain                                                                                                  |
| `prefixed` | `<prefix>.ucarecd.net` | per-project subdomain, computed from your public key. Yes, `ucarecd.net` — a different zone than `ucarecdn.com`, not a typo |
| `custom`   | `cdn.example.com`      | your CNAME                                                                                                                  |
| `proxy`    | `<pubkey>.ucr.io`      | delivery proxy endpoints                                                                                                    |

```ts
import { detectDomainKind } from '@uploadcare/cdn-url'

detectDomainKind('https://1zlmtnsbgr.ucarecd.net') // → 'prefixed'
```

The parser and serializer work identically on all of them — the origin is just a field, which makes [rebasing between domains](/how-to/render-stored-urls#rebasing-onto-another-domain) a one-liner.

## Group URLs

A group id is a uuid with a file count: `:uuid~3`. Group **roots** list the files and cannot carry operations; individual files are addressed with `nth` (zero-based) and can:

```
https://ucarecdn.com/:uuid~3/                          group root
https://ucarecdn.com/:uuid~3/nth/1/-/resize/256x/      second file, resized
https://ucarecdn.com/:uuid~3/archive/zip/all.zip       originals as an archive
```

See [Groups & archives](/how-to/groups-and-archives).

## Proxy URLs

The delivery proxy fetches **remote** sources through the CDN. Operations sit between the endpoint and the embedded source URL, which keeps its own query string:

```
https://pubkey.ucr.io/-/preview/-/resize/500x/https://example.com/image.jpg?v=2
└────────┬──────────┘└──────────┬───────────┘└──────────────┬─────────────────┘
       origin              operations                    sourceUrl
```

See [Remote images via proxy](/how-to/remote-images-via-proxy).

## Conversion paths

Two different beasts, easy to confuse:

- **`gif2video` is a URL** — an on-the-fly CDN operation: `https://…/:uuid/gif2video/-/format/webm/`. Note there's no `-/` between the uuid and the prefix.
- **`video` and `document` are paths, not URLs** — `/:uuid/video/-/size/720x540/` strings you submit to the REST convert API. The library builds them with `videoPath` / `documentPath` and deliberately returns no domain.

The parser still understands `/:uuid/video/…` inside a full URL, because finished conversion jobs are addressable on the CDN that way.

## Query strings and fragments

`?token=…` (secure delivery signatures) and `#fragments` are preserved verbatim through parse → serialize. The library **never generates** tokens — and remember that editing operations invalidates an existing signature, since it was computed over the old path.
