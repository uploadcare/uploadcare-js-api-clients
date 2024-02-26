import { readJpegChunks } from './readJpegChunks'

export const replaceJpegChunk = async (
  blob: Blob,
  marker: number,
  chunks: ArrayBuffer[]
) => {
  {
    const oldChunkPos: number[] = []
    const oldChunkLength: number[] = []

    const { promiseReadJpegChunks, stack } = readJpegChunks()

    await promiseReadJpegChunks(blob)

    stack.forEach((chunk) => {
      if (chunk.marker === marker) {
        oldChunkPos.push(chunk.startPos)
        return oldChunkLength.push(chunk.length)
      }
    })

    const newChunks: (ArrayBuffer | Blob)[] = [blob.slice(0, 2)]

    for (const chunk of chunks) {
      const intro = new DataView(new ArrayBuffer(4))
      intro.setUint16(0, 0xff00 + marker)
      intro.setUint16(2, chunk.byteLength + 2)
      newChunks.push(intro.buffer)
      newChunks.push(chunk)
    }

    let pos = 2
    for (let i = 0; i < oldChunkPos.length; i++) {
      if (oldChunkPos[i] > pos) {
        newChunks.push(blob.slice(pos, oldChunkPos[i]))
      }
      pos = oldChunkPos[i] + oldChunkLength[i] + 4
    }

    newChunks.push(blob.slice(pos, blob.size))

    return new Blob(newChunks, {
      type: blob.type
    })
  }
}
