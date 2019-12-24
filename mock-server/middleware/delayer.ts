const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

const delayer = async (ctx, next) => {
  await delay(10)
  await next()
}

export default delayer
