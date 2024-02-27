import { type Middleware } from 'koa'

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

const delayer: Middleware = async (ctx, next) => {
  await delay(30)
  await next()
}

export default delayer
