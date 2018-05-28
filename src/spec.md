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
const promise = uploadApi.request('POST', 'base', {
  file: 'Blob/Stream/etc'
})

result.progress(progress => {
  // catch progress
})

try {
  const result = await promise
}
catch(e) {
  console.log(e);
}
```

# cancel

```javascript
const request = uploadApi.request('POST', 'base', {
  file: 'Blob/Stream/etc'
})

request
.response
  .then()
  .catch()
.progress(() =>)
.cancel()

await request.response

request.cancel()
```

#

```javascript
upload.request('POST', 'base', options)


const request = upload.fromUrl(options)
const request = upload.fromUrl(url, options)

const request = upload.base(file, options)

const ({code, data: {token}}) = await request.response

const request2 = upload.fromUrlStatus(token)

const ({code: data: {uuid}}) = await request2.response
```

# low-level request

```javascript
api.request(method, path, params)
```

# high level api

```javascript
api.file('file' || 'blob' || 'buffer' || 'url', file, options) // single

api.group('file', [files], options) // group

api.fileInfo(uuid, options)
api.groupInfo(groupId, options)
api.status(token, options)
```
