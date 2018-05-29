import fromUrlStatus from './index'

describe('fromUrlStatus', () => {
  it('should return UCRequest', () => {
    const token = ''
    const ucRequest = fromUrlStatus(token)

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
  })
})
