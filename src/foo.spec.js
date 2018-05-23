import {foo} from './foo'

describe('foo', () => {
  it('should return bar', async() => {
    expect.assertions(1)

    return await expect(foo()).resolves.toEqual('bar')
  })
})
