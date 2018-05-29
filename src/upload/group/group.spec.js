import group from './index'

describe('group', () => {
  it('should return UCRequest', () => {
    const files = []
    const ucRequest = group(files)

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
  })
})
