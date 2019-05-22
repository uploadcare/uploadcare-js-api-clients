import Koa from 'koa'
import * as router from 'koa-route'
import chalk from 'chalk'

// Middleware
import cors from '@koa/cors'
import addTrailingSlashes from 'koa-add-trailing-slashes'
import koaBody from 'koa-body'

import logger from './middleware/logger'
import auth from './middleware/auth'

// Config
import {PORT} from './config'

// Routes
import {ROUTES, RouteType} from './routes'

const app = new Koa()

// Use middleware
app.use(cors())
app.use(addTrailingSlashes())
app.use(logger)
app.use(koaBody({
  multipart: true,
}))
app.use(auth)

// Routes
ROUTES.forEach((route: RouteType) => {
  const path = Object.keys(route).shift()
  const method = route[path].method
  const fn = route[path].fn

  app.use(router[method](path, fn))
})

// Handle errors
app.on('error', (err, ctx) => {
  console.error(`💔 ${chalk.red('Server error')}:`)
  console.error(err)
  console.error(ctx)
});

// Listen server
app.listen(PORT, () => {
  console.log(`🚀 ${chalk.green('Server started at')} ${chalk.bold(`http://localhost:${PORT}`)}`, '\n')
  console.log('Available routes:', '\n')

  // Print all available routes
  ROUTES.forEach((route: RouteType) => {
    const path = Object.keys(route).shift()
    const method = route[path].method.toUpperCase()

    console.log(`  ${chalk.bold(method)}: '${path}'`)
  })
  console.log()
})
