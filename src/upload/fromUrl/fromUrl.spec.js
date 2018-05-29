import fromUrl from './index'

describe('fromUrl', () => {
  it('should return UCRequest', () => {
    const source = ''
    const options = {}
    const ucRequest = fromUrl(source, options)

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
  })
})
