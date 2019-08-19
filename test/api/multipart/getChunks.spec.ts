import {getChunks} from '../../../src/api/multipart/getChunks'

describe('API - multipart, getChunks', () => {
  it('should return array of chunks', () => {
    const fileSize = 11 * 1024 * 1024
    const chunkSize = 5 * 1024 * 1024
    const chunks = getChunks(fileSize, chunkSize)

    expect(chunks).toContain([ 0, 5242880 ])
    expect(chunks).toContain([ 5242880, 10485760 ])
    expect(chunks).toContain([ 10485760, 11534336 ])
  })
})
