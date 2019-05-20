const Koa = require('koa')
const route = require('koa-route')

const app = new Koa()

import * as base from './controllers/base'
import * as fromUrl from './controllers/from_url'
import * as info from './controllers/info'
import addTrailingSlashes from 'koa-add-trailing-slashes'

// import auth from './middleware/auth'
// import multipart from './middleware/multipart'

import {PORT} from './config'

// Use middleware
app.use(addTrailingSlashes())
// app.use(multipart)
// app.use(auth)
app.use(route.post('/base', base.index))
app.use(route.post('/from_url', fromUrl.index))
app.use(route.get('/from_url/status', fromUrl.status))
app.use(route.get('/info', info.uuid))

app.on('error', (err, ctx) => {
  console.error('💔 Server error:')
  console.error(err)
  console.error(ctx)
});

app.listen(PORT, () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`)
})
