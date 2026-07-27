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

::: code-group

```ts [Atomic]
import { groupUrl, nthUrl } from '@uploadcare/cdn-url/group'
import { preview } from '@uploadcare/cdn-url/ops'

groupUrl('https://ucarecdn.com', group)
// → https://ucarecdn.com/:uuid~3/            (lists the files)

nthUrl('https://ucarecdn.com', group, 0)
// → https://ucarecdn.com/:uuid~3/nth/0/      (first file, zero-based)

nthUrl('https://ucarecdn.com', group, 1, [preview(400, 400)])
// → https://ucarecdn.com/:uuid~3/nth/1/-/preview/400x400/
```

```ts [Builder]
import { CdnUrl } from '@uploadcare/cdn-url/builder'
import { preview } from '@uploadcare/cdn-url/ops'

new CdnUrl({ origin: 'https://ucarecdn.com', group }).href
// → https://ucarecdn.com/:uuid~3/

new CdnUrl({
  origin: 'https://ucarecdn.com',
  group,
  nth: 1,
  operations: [preview(400, 400)]
}).href
// → https://ucarecdn.com/:uuid~3/nth/1/-/preview/400x400/
```

```ts [Fluent]
import { cdn } from '@uploadcare/cdn-url/fluent'

cdn.group(group).href
// → https://ucarecdn.com/:uuid~3/

cdn.group(group).nth(1).preview(400, 400).href
// → https://ucarecdn.com/:uuid~3/nth/1/-/preview/400x400/
```

:::

Two rules the library enforces for you:

- Group roots can't carry operations. Transformations go on `nth` elements only, and the parsed `group` shape doesn't even have an `operations` field.
- The index is validated against the count, so `nthUrl(origin, group, 3)` on a `~3` group throws a `RangeError` in development.

## Rendering a gallery

```ts
const thumbs = Array.from({ length: group.count }, (_, i) =>
  nthUrl('https://ucarecdn.com', group, i, [preview(300, 300)])
)
```

## Archives

Hand the whole group to the user as one download:

::: code-group

```ts [Atomic]
import { archiveUrl } from '@uploadcare/cdn-url/group'

archiveUrl('https://ucarecdn.com', group, 'zip')
// → https://ucarecdn.com/:uuid~3/archive/zip/

archiveUrl('https://ucarecdn.com', group, 'tar', 'photos.tar')
// → https://ucarecdn.com/:uuid~3/archive/tar/photos.tar
```

```ts [Fluent]
import { cdn } from '@uploadcare/cdn-url/fluent'

cdn.group(group).archive('zip')
// → https://ucarecdn.com/:uuid~3/archive/zip/

cdn.group(group).archive('tar', 'photos.tar')
// → https://ucarecdn.com/:uuid~3/archive/tar/photos.tar
```

:::

There is no builder tab here. `CdnUrl` addresses one URL and has no `archive` method, so archives come from the `group` entry or a fluent group chain.

Archive fine print: you get originals only (transformations are discarded), the uncompressed limit is 2 GB, and the request 404s if any file in the group was removed.
