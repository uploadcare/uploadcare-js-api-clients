```javascript
import {createUploadApi} from '@uploadcare/api'
```

# initialization

```javascript
const uploadApi = createUploadApi({
  publicKey: '',
  signature: '',
  expire: 0,
  store: false,
  userAgent: {
    plugin: {
      name: 'MyPlugin',
      version: '0.0.9'
    },
    framework: {
      name: 'React',
      version: '16.0.0'
    }
  }
})

uploadApi.request('GET', 'base', options)
uploadApi.base(options)
```

# upload file

```javascript
uploadApi.request('POST', 'base', {
  file: 'Blob/Stream/etc'
})
.then(({code, data}) => {
  // http code
  // response data
})
.catch((error) => ())
```

# get group info

```javascript
uploadApi.request('GET', 'group/info', {
  'group_id': ''
})
```

# progress

```javascript
uploadApi.request('POST', 'base', {
  file: 'Blob/Stream/etc'
})
.progress((progress) => {
  console.log(progress); // { total: 1024, uploaded: 10 }
})
```

# async/await

```javascript
const ucRequest = uploadApi.request('POST', 'base', {
  file: 'Blob/Stream/etc'
})

ucRequest.progress(progress => {
  // catch progress
})

try {
  const {code, data} = await ucRequest.promise
}
catch(e) {
  console.log(e);
}

ucRequest.cancel()
```

# cancel

```javascript
const request = uploadApi.request('POST', 'base', {
  file: 'Blob/Stream/etc'
})

request
.promise
  .then()
  .catch()
.progress(() => {})
.cancel()
```

#

```javascript
upload.request('POST', 'base', options)


const request = upload.fromUrl(options)
const request = upload.fromUrl(url, options)

const request = upload.base(file, options)

const ({code, data: {token}}) = await request.promise

const request2 = upload.fromUrlStatus(token)

const ({code: data: {uuid}}) = await request2.promise
```

# low-level request

```javascript
api.request(method, path, params)
```

# high level api

```javascript
api.file('file' || 'blob' || 'buffer' || 'url', file, options) // single
api.files('file' || 'blob' || 'buffer' || 'url', [file], options) // single

api.fileInfo(uuid, options)
api.groupInfo(groupId, options)
api.status(token, options)
```

```javascript
const file = api.files('blob', blob, {})
await file.info()

const group = api.files('blob', [blobs], {})
await group.info()


```

