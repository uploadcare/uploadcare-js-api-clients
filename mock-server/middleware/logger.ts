import chalk from 'chalk'

/**
 * Pretty print for JSON.
 * @param {object} json
 * @return {string}
 */
const pretty = (json: object): string => JSON.stringify(json, null, 2)

/**
 * Logger for requests and responses.
 * @param {object} ctx
 * @param {function} next
 */
const logger = async (ctx, next) => {
  await next();

  const request = `${chalk.gray('-->')} ${chalk.bold(ctx.request.method)} ${chalk.gray(ctx.request.url)}`
  const requestBody = ctx.request.body
  const requestQuery = ctx.request.query

  const status = ctx.response.status
  const message = ctx.response.message
  const isPositive = status >= 200 && status < 300
  const statusMessage = `${status.toString()} ${message}`
  const coloredStatusMessage = isPositive ? `${chalk.green(statusMessage)}` : `${chalk.red(statusMessage)}`

  const response = `${chalk.gray('<--')} ${chalk.bold(coloredStatusMessage)}`
  const responseBody = ctx.response.body

  console.log(request)

  if (requestBody) {
    console.log('Request Body:')
    console.log(pretty(requestBody))
  }

  if (requestQuery) {
    console.log('Request Query:')
    console.log(pretty(requestQuery))
  }

  console.log()
  console.log(response)

  if (responseBody) {
    console.log('Response Body:')
    console.log(pretty(responseBody))
  }
}

export default logger
