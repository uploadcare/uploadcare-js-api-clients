type TChunk = {
  startPos: number
  length: number
  marker: number
  view: DataView
}

export const readJpegChunks = () => {
  const stack: TChunk[] = []
  const promiseReadJpegChunks = (blob: Blob) =>
    new Promise<boolean>((resolve, reject) => {
      let pos = 2
      const readToView = (blob: Blob, cb: (view: DataView) => void) => {
        const reader = new FileReader()

        reader.addEventListener('load', () => {
          cb(new DataView(reader.result as ArrayBuffer))
        })

        reader.addEventListener('error', (e) => {
          reject(`Reader error: ${e}`)
        })

        reader.readAsArrayBuffer(blob)
      }

      const readNext = () =>
        readToView(blob.slice(pos, pos + 128), (view: DataView) => {
          let i, j, ref
          for (
            i = j = 0, ref = view.byteLength;
            ref >= 0 ? j < ref : j > ref;
            i = ref >= 0 ? ++j : --j
          ) {
            if (view.getUint8(i) === 0xff) {
              pos += i
              break
            }
          }

          readNextChunk()
        })

      const readNextChunk = () => {
        const startPos = pos

        return readToView(blob.slice(pos, (pos += 4)), (view: DataView) => {
          if (view.byteLength !== 4 || view.getUint8(0) !== 0xff) {
            reject('Corrupted')
            return
          }

          const marker = view?.getUint8(1)

          if (marker === 0xda) {
            resolve(true)
            return
          }

          const length = view.getUint16(2) - 2
          return readToView(
            blob.slice(pos, (pos += length)),
            (view: DataView) => {
              if (view.byteLength !== length) {
                reject('Corrupted')
                return
              }

              stack.push({ startPos, length, marker, view })
              readNext()
            }
          )
        })
      }

      if (!(FileReader && DataView)) {
        reject('Not Support')
      }

      readToView(blob.slice(0, 2), (view: DataView) => {
        if (view.getUint16(0) !== 0xffd8) {
          reject('Not jpeg')
        }

        readNext()
      })
    })

  return {
    stack,
    promiseReadJpegChunks
  }
}
