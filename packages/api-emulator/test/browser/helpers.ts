/** What an XHR saw: its status, body, and every `xhr.upload` event in order. */
export type XhrResult = {
  status: number
  error: boolean
  body: string
  uploadEvents: string[]
  /**
   * Whether a `setTimeout(0)` queued right after `send()` ran before the first
   * upload event.
   */
  macrotaskBeforeUpload: boolean | undefined
  /** Whether that `setTimeout(0)` ran before `load` (or `error`). */
  macrotaskBeforeLoad: boolean
}

export const sendXhr = (
  method: string,
  url: string,
  body?: XMLHttpRequestBodyInit,
  headers: Record<string, string> = {}
): Promise<XhrResult> =>
  new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    const uploadEvents: string[] = []
    let macrotask = false
    let macrotaskBeforeUpload: boolean | undefined
    for (const type of ['loadstart', 'progress', 'load', 'loadend']) {
      xhr.upload.addEventListener(type, () => {
        macrotaskBeforeUpload ??= macrotask
        uploadEvents.push(type)
      })
    }
    const done = (error: boolean) => () =>
      resolve({
        status: xhr.status,
        error,
        body: error ? '' : xhr.responseText,
        uploadEvents,
        macrotaskBeforeUpload,
        macrotaskBeforeLoad: macrotask
      })
    xhr.addEventListener('load', done(false))
    xhr.addEventListener('error', done(true))
    xhr.open(method, url)
    for (const [name, value] of Object.entries(headers))
      xhr.setRequestHeader(name, value)
    xhr.send(body)
    setTimeout(() => {
      macrotask = true
    })
  })

/** A real PNG, so an `<img>` can prove the CDN served back the uploaded bytes. */
export const pngOf = (width: number, height: number): Promise<Blob> => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/png'
    )
  )
}

export const uploadForm = (file: Blob) => {
  const form = new FormData()
  form.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  form.set('file', file, 'file.png')
  return form
}

/** Resolves with the loaded image, rejects if it fails to load. */
export const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', () => reject(new Error(`${src} failed`)))
    img.src = src
  })

/**
 * The page's own origin under its other loopback name: same server, foreign
 * origin.
 */
export const foreignOrigin = () => {
  const url = new URL(location.href)
  url.hostname = url.hostname === 'localhost' ? '127.0.0.1' : 'localhost'
  return url.origin
}
