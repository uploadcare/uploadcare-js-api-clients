const Busboy = require('busboy')
const inspect = require('util').inspect

/**
 * Extract multipart fields.
 * @param {object} ctx
 * @param {function} next
 */
const multipart = (ctx, next) => {
  if (ctx.request.method === 'POST') {
    const busboy = new Busboy({headers: ctx.request.headers})
    let fields = []

    busboy.on('field', (fieldName, fieldValue) => {
      fields[fieldName] = inspect(fieldValue)
    })

    busboy.on('finish', () => {
      ctx.request.multipart.fields = fields
      next()
    })

    ctx.request.pipe(busboy)
  } else {
    next()
  }
}

export default multipart
