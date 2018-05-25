import fromUrlStatus from './index'

describe('fromUrlStatus', () => {
  it('should return success response', async() => {
    const token = ''

    return await expect(fromUrlStatus(token)).resolves.toEqual(true)
  })
})
