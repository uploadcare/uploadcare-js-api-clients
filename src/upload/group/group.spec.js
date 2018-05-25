import group from './index'

describe('group', () => {
  it('should return success response', async() => {
    const files = []

    return await expect(group(files)).resolves.toEqual(true)
  })
})
