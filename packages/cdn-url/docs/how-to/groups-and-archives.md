# Groups & archives

A [file group](https://uploadcare.com/docs/file-groups/) is an immutable, ordered bundle of files behind one id: a uuid with a count suffix, like `:uuid~3`.

## Working with group ids

```ts
import { formatGroupId, parseGroupId } from '@uploadcare/cdn-url/group'

const group = parseGroupId('c2499162-eb07-4b93-b31e-94a89a47e858~3')
// → { uuid: 'c2499162-…', count: 3 }

formatGroupId(group) // → 'c2499162-…~3'
```

`parseGroupId` throws a `TypeError` on malformed ids in every bundle flavor, which makes it handy for validating stored values.

## Addressing the group and its files

Group URLs need the same [CDN base](/guide/cdn-base) as file URLs — the first argument of `groupUrl`/`nthUrl`/`archiveUrl`, or the one bound into a fluent `base(...)`. There is no string-level tab here: [`tinyParse`](/guide/string-level-api) reads a group element's `nth/1/` as part of the chain, so replacing the chain drops the addressing.

::: code-group

```ts [Atomic]
import { groupUrl, nthUrl } from '@uploadcare/cdn-url/group'
import { preview } from '@uploadcare/cdn-url/ops'

groupUrl('https://1s4oyld5dc.ucarecd.net', group)
// → https://1s4oyld5dc.ucarecd.net/:uuid~3/            (lists the files)

nthUrl('https://1s4oyld5dc.ucarecd.net', group, 0)
// → https://1s4oyld5dc.ucarecd.net/:uuid~3/nth/0/      (first file, zero-based)

nthUrl('https://1s4oyld5dc.ucarecd.net', group, 1, [preview(400, 400)])
// → https://1s4oyld5dc.ucarecd.net/:uuid~3/nth/1/-/preview/400x400/
```

```ts [Builder]
import { CdnUrl } from '@uploadcare/cdn-url/builder'
import { preview } from '@uploadcare/cdn-url/ops'

new CdnUrl({ cdnBase: 'https://1s4oyld5dc.ucarecd.net', group }).href
// → https://1s4oyld5dc.ucarecd.net/:uuid~3/

new CdnUrl({
  cdnBase: 'https://1s4oyld5dc.ucarecd.net',
  group,
  nth: 1,
  operations: [preview(400, 400)]
}).href
// → https://1s4oyld5dc.ucarecd.net/:uuid~3/nth/1/-/preview/400x400/
```

```ts [Fluent]
import { base, prefixedCdnBase } from '@uploadcare/cdn-url/fluent'

const cdn = base(prefixedCdnBase('demopublickey'))

cdn.group(group).href
// → https://1s4oyld5dc.ucarecd.net/:uuid~3/

cdn.group(group).nth(1).preview(400, 400).href
// → https://1s4oyld5dc.ucarecd.net/:uuid~3/nth/1/-/preview/400x400/
```

:::

Two rules the library enforces for you:

- Group roots can't carry operations. Transformations go on `nth` elements only, and the parsed `group` shape doesn't even have an `operations` field.
- The index is validated against the count, so `nthUrl(cdnBase, group, 3)` on a `~3` group throws a `RangeError` in development.

## Rendering a gallery

```ts
const thumbs = Array.from({ length: group.count }, (_, i) =>
  nthUrl('https://1s4oyld5dc.ucarecd.net', group, i, [preview(300, 300)])
)
```

## Archives

Hand the whole group to the user as one download:

::: code-group

```ts [Atomic]
import { archiveUrl } from '@uploadcare/cdn-url/group'

archiveUrl('https://1s4oyld5dc.ucarecd.net', group, 'zip')
// → https://1s4oyld5dc.ucarecd.net/:uuid~3/archive/zip/

archiveUrl('https://1s4oyld5dc.ucarecd.net', group, 'tar', 'photos.tar')
// → https://1s4oyld5dc.ucarecd.net/:uuid~3/archive/tar/photos.tar
```

```ts [Fluent]
import { base, prefixedCdnBase } from '@uploadcare/cdn-url/fluent'

const cdn = base(prefixedCdnBase('demopublickey'))

cdn.group(group).archive('zip')
// → https://1s4oyld5dc.ucarecd.net/:uuid~3/archive/zip/

cdn.group(group).archive('tar', 'photos.tar')
// → https://1s4oyld5dc.ucarecd.net/:uuid~3/archive/tar/photos.tar
```

:::

There is no builder tab here. `CdnUrl` addresses one URL and has no `archive` method, so archives come from the `group` entry or a fluent group chain.

Archive fine print: you get originals only (transformations are discarded), the uncompressed limit is 2 GB, and the request 404s if any file in the group was removed.
