type TChunk = {
  startPos: number
  length: number
  marker: number
  view: DataView
}

export const readJpegChunks = () => {
  const stack: TChunk[] = []
  // TODO: rename to blob
  const promiseReadJpegChunks = (file: Blob) =>
    new Promise((resolve, reject) => {
      let pos: number
      const readToView = (file: Blob, cb: (view: DataView) => void) => {
        const reader = new FileReader()

        reader.addEventListener('load', () => {
          cb(new DataView(reader.result as ArrayBuffer))
        })

        reader.addEventListener('error', (e) => {
          reject(`Reader error: ${e}`)
        })

        reader.readAsArrayBuffer(file)
      }

      // @ts-expect-error TODO: fix this
      const readNext = () =>
        readToView(file.slice(pos, pos + 128), (view: DataView) => {
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

          return readNextChunk()
        })

      // @ts-expect-error TODO: fix this
      const readNextChunk = () => {
        const startPos = pos

        return readToView(file.slice(pos, (pos += 4)), (view: DataView) => {
          if (view.byteLength !== 4 || view.getUint8(0) !== 0xff) {
            return reject('Corrupted')
          }

          const marker = view?.getUint8(1)

          if (marker === 0xda) {
            return resolve(true)
          }

          const length = view.getUint16(2) - 2
          return readToView(
            file.slice(pos, (pos += length)),
            (view: DataView) => {
              if (view.byteLength !== length) {
                return reject('Corrupted')
              }

              stack.push({ startPos, length, marker, view })
              return readNext()
            }
          )
        })
      }

      if (!(FileReader && DataView)) {
        reject('Not Support')
      }

      pos = 2
      readToView(file.slice(0, 2), function (view: DataView) {
        if (view.getUint16(0) !== 0xffd8) {
          reject('Not jpeg')
        }

        return readNext()
      })
    })

  return {
    stack,
    promiseReadJpegChunks
  }
}
