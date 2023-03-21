# Uploadcare REST API Client

<a href="https://uploadcare.com/?utm_source=github&utm_campaign=uploadcare-js-api-clients">
    <img align="right" width="64" height="64"
      src="https://ucarecdn.com/edfdf045-34c0-4087-bbdd-e3834921f890/userpiccircletransparent.svg"
      alt="">
</a>

This is an Uploadcare [REST API][uc-docs-rest-api] wrapper to work with
Node.js and browser.

[API Reference](https://uploadcare.github.io/uploadcare-js-api-clients/rest-client/)

[![Build Status][badge-build]][build-url]
[![NPM version][npm-img]][npm-url]
[![GitHub release][badge-release-img]][badge-release-url]&nbsp;
[![Uploadcare stack on StackShare][badge-stack-img]][badge-stack-url]

<!-- toc -->
- [Install](#install)
- [Usage](#usage)
  - [Authentication](#authentication)
  - [API](#api)
  - [Settings](#settings)
  - [Pagination](#pagination)
  - [Job status polling](#job-status-polling)
- [Security issues](#security-issues)
- [Feedback](#feedback)

<!-- tocstop -->

## Install

```bash
npm install @uploadcare/rest-client
```

## Usage

### Authentication

Every REST API request should be authenticated using your secret key.

According to the [spec](https://uploadcare.com/api-refs/rest-api/v0.7.0/#section/Authentication), there are two available authentication methods:

1. `Uploadcare.Simple`
2. `Uploadcare`

#### `Uploadcare.Simple` authentication method

With the [`Uploadcare.Simple`](https://uploadcare.com/api-refs/rest-api/v0.7.0/#section/Authentication/Uploadcare.Simple) authentication method, your secret key gets included in every request. This method isn't secure enough because secret key is exposed to the runtime and will be transmitted over the network.

**⚠️We strongly recommend not to use this method in production, especially on the client-side.⚠️**

Example:

```typescript
import { listOfFiles, UploadcareSimpleAuthSchema } from '@uploadcare/rest-client';

const uploadcareSimpleAuthSchema = new UploadcareSimpleAuthSchema({
  publicKey: 'YOUR_PUBLIC_KEY',
  secretKey: 'YOUR_SECRET_KEY',
});

const result = await listOfFiles({}, { authSchema: uploadcareSimpleAuthSchema })
```

#### `Uploadcare` authentication method

With the [`Uploadcare`](https://uploadcare.com/api-refs/rest-api/v0.7.0/#section/Authentication/Uploadcare) authentication method, your secret key is used to derive signature but isn't included in every request itself.

**Builtin signature resolver**

You can use the builtin signature resolver, which automatically generates signature in-place using `crypto` module at Node.js or Web Crypto API at browsers.

```typescript
import { UploadcareAuthSchema } from '@uploadcare/rest-client';

new UploadcareAuthSchema({
  publicKey: 'YOUR_PUBLIC_KEY',
  secretKey: 'YOUR_SECRET_KEY',
})
```

**⚠️We strongly recommend not to use builtin signature resolver on the client-side.⚠️**

**Custom signature resolver**

This option is useful on the client-side to avoid secret key leak. You need to implement some backend endpoint, which will generate signature. In this case, secret key will be stored on your server only and will not be disclosed.

```typescript
import { UploadcareAuthSchema } from '@uploadcare/rest-client';

new UploadcareAuthSchema({
  publicKey: 'YOUR_PUBLIC_KEY',
  signatureResolver: async (signString) => {
    /**
     * You need to make HTTPS request to your backend endpoint,
     * which should sign the `signString` using secret key.
     */
    const response = await fetch(`/sign-request?signString=${encodeURIComponent(signString)}`);
    const signature = await response.text();
    return signature;
  }
})
```

And then somewhere on your backend:

```javascript
import { createSignature } from '@uploadcare/rest-client';

app.get('/sign-request', async (req, res) => {
  const signature = await createSignature('YOUR_SECREY_KEY', req.query.signString);
  res.send(signature);
})

```

### API

You can use low-level wrappers to call the API endpoints directly:

```typescript
import { listOfFiles, UploadcareSimpleAuthSchema } from '@uploadcare/rest-client';

const uploadcareSimpleAuthSchema = new UploadcareSimpleAuthSchema({
  publicKey: 'YOUR_PUBLIC_KEY',
  secretKey: 'YOUR_SECRET_KEY',
});

const result = await listOfFiles({}, { authSchema: uploadcareSimpleAuthSchema })
```

List of all available API methods is available at the [rest-client API Reference](https://uploadcare.github.io/uploadcare-js-api-clients/rest-client/).

### Settings

List of all available Settings is available at the [rest-client API Reference](https://uploadcare.github.io/uploadcare-js-api-clients/rest-client/modules#UserSettings).

### Pagination

We have the only two paginatable API methods - `listOfFiles` and `listOfGroups`. You can use one of those methods below to paginate over.

#### Using async generator and `paginate()` helper

```typescript
import { listOfFiles, paginate } from '@uploadcare/rest-client'

const uploadcareSimpleAuthSchema = new UploadcareSimpleAuthSchema({
  publicKey: 'YOUR_PUBLIC_KEY',
  secretKey: 'YOUR_SECRET_KEY',
});

const paginatedListOfFiles = paginate(listOfFiles)
const pages = paginatedListOfFiles({}, { authSchema: uploadcareSimpleAuthSchema })

for await (const page of pages) {
  console.log(page)
}
```

#### Using `Paginator` class

```typescript
import { listOfFiles, Paginator } from '@uploadcare/rest-client'

const uploadcareSimpleAuthSchema = new UploadcareSimpleAuthSchema({
  publicKey: 'YOUR_PUBLIC_KEY',
  secretKey: 'YOUR_SECRET_KEY',
});

const paginator = new Paginator(listOfFiles, {}, { authSchema: uploadcareSimpleAuthSchema })

while(paginator.hasNextPage()) {
  const page = await paginator.next()
  console.log(page)
}

while(paginator.hasPrevPage()) {
  const page = await paginator.prev()
  console.log(page)
}

console.log(paginator.getCurrentPage())
```

Check out the [rest-client API Reference](https://uploadcare.github.io/uploadcare-js-api-clients/rest-client/classes/Paginator) for the `Paginator`.

#### Job status polling

There are two helpers to do job status polling using Conversion API or Addons API: `conversionJobPoller` and `addonJobPoller`.

##### Conversion API

```ts
import {
  conversionJobPoller,
  ConversionType,
  UploadcareSimpleAuthSchema
} from '@uploadcare/rest-client'

const uploadcareSimpleAuthSchema = new UploadcareSimpleAuthSchema({
  publicKey: 'YOUR_PUBLIC_KEY',
  secretKey: 'YOUR_SECRET_KEY'
})

const abortController = new AbortController()
// abortController.abort()

const jobs = await conversionJobPoller(
  {
    type: ConversionType.VIDEO,
    // type: ConversionType.DOCUMENT,
    onRun: response => console.log(response), // called when job is started
    onStatus: response => console.log(response), // called on every job status request
    paths: [':uuid/video/-/size/x720/', ':uuid/video/-/size/x360/'],
    store: false,
    pollOptions: {
      signal: abortController.signal
    }
  },
  { authSchema: uploadcareSimpleAuthSchema }
)

const results = Promise.allSettled(jobs)

console.log(results)
```

##### Addons API

```ts
import {
  addonJobPoller,
  AddonName,
  UploadcareSimpleAuthSchema
} from '@uploadcare/rest-client'

const uploadcareSimpleAuthSchema = new UploadcareSimpleAuthSchema({
  publicKey: 'YOUR_PUBLIC_KEY',
  secretKey: 'YOUR_SECRET_KEY'
})

const abortController = new AbortController()
// abortController.abort()

const result = await addonJobPoller(
  {
    addonName: AddonName.UC_CLAMAV_VIRUS_SCAN,
    // addonName: AddonName.AWS_REKOGNITION_DETECT_LABELS,
    // addonName: AddonName.REMOVE_BG,
    onRun: response => console.log(response), // called when job is started
    onStatus: response => console.log(response), // called on every job status request
    target: ':uuid',
    params: {
      purge_infected: false
    },
    pollOptions: {
      signal: abortController.signal
    }
  },
  testSettings
)

console.log(result)
```

## Security issues

If you think you ran into something in Uploadcare libraries that might have
security implications, please hit us up at
[bugbounty@uploadcare.com][uc-email-bounty] or Hackerone.

We'll contact you personally in a short time to fix an issue through co-op and
prior to any public disclosure.

## Feedback

Issues and PRs are welcome. You can provide your feedback or drop us a support
request at [hello@uploadcare.com][uc-email-hello].

[uc-email-bounty]: mailto:bugbounty@uploadcare.com
[uc-email-hello]: mailto:hello@uploadcare.com
[badge-stack-img]: https://img.shields.io/badge/tech-stack-0690fa.svg?style=flat
[badge-stack-url]: https://stackshare.io/uploadcare/stacks/
[badge-release-img]: https://img.shields.io/github/release/uploadcare/uploadcare-js-api-clients.svg
[badge-release-url]: https://github.com/uploadcare/uploadcare-js-api-clients/releases
[npm-img]: http://img.shields.io/npm/v/@uploadcare/rest-client.svg
[npm-url]: https://www.npmjs.org/package/@uploadcare/rest-client
[badge-build]: https://github.com/uploadcare/uploadcare-js-api-clients/actions/workflows/checks.yml/badge.svg
[build-url]: https://github.com/uploadcare/uploadcare-js-api-clients/actions/workflows/checks.yml
[uc-docs-rest-api]: https://uploadcare.com/api-refs/rest-api/v0.7.0/?utm_source=github&utm_campaign=uploadcare-js-api-clients
