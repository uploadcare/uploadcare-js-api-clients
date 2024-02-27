import { TaskContext } from 'vitest'

export const uploadImage = (blob: Blob, variant: string, ctx?: TaskContext) => {
  const ext = blob.type.replace('image/', '')
  let filename = `${variant}.${ext}`
  if (ctx) {
    filename = `${ctx.task.suite.name}__${ctx.task.name}__${variant}.${ext}`
  }
  return fetch(`/upload-image?filename=${filename}`, {
    method: 'POST',
    body: blob
  })
}
