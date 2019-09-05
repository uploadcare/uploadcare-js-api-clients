import * as factory from '../../_fixtureFactory'
import {getFileSize} from '../../../src/api/multipart/getFileSize'

describe('API - multipart, getFileSize', () => {
  it('should return correct file size', () => {
    const fileToUpload = factory.file(11).data
    const fileSize = getFileSize(fileToUpload)

    expect(fileSize).toBe(11534336)
  })
})
