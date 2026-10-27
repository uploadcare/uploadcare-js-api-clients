import { TestContext } from 'vitest'

export const uploadImage = (blob: Blob, variant: string, ctx?: TestContext) => {
  const ext = blob.type.replace('image/', '')
  let filename = `${variant}.${ext}`
  if (ctx) {
    filename = `${ctx.task.suite?.name}__${ctx.task.name}__${variant}.${ext}`
  }
  return fetch(`/upload-image?filename=${filename}`, {
    method: 'POST',
    body: blob
  })
}
