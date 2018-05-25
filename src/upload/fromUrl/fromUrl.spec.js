import fromUrl from './index'

describe('fromUrl', () => {
  it('should return success response', async() => {
    const source = ''
    const options = {}

    return await expect(fromUrl(source, options)).resolves.toEqual(true)
  })
})
