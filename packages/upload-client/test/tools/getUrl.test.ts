import getUrl from '../../src/tools/getUrl'

describe('create URL', () => {
  it('should create url', () => {
    expect(getUrl('https://domain.com', '/base/')).toBe(
      'https://domain.com/base/'
    )
  })

  it('should work with query', () => {
    expect(
      getUrl('https://domain.com', '/base/', { lol: 'param', kek: 'param' })
    ).toBe('https://domain.com/base/?lol=param&kek=param')
  })

  it('should accept arrays', () => {
    expect(
      getUrl('https://domain.com', '/base/', {
        lol: 'param',
        kek: ['param1', 'param2']
      })
    ).toBe(
      'https://domain.com/base/?lol=param&kek%5B%5D=param1&kek%5B%5D=param2'
    )
  })

  it('should escape url', () => {
    expect(
      getUrl('https://domain.com', '/base/', {
        lol: 'https://domain.com'
      })
    ).toBe('https://domain.com/base/?lol=https%3A%2F%2Fdomain.com')
  })

  it('should accept objects', () => {
    expect(
      getUrl('https://domain.com', '/base/', {
        key0: 'value0',
        key1: {
          deepKey0: 'deepValue0',
          deepKey1: 1,
          deepKey2: undefined,
          deepKey3: null,
          deepKey4: ''
        }
      })
    ).toBe(
      'https://domain.com/base/?key0=value0&key1%5BdeepKey0%5D=deepValue0&key1%5BdeepKey1%5D=1'
    )
  })

  it('should ignore falsy values', () => {
    expect(
      getUrl('https://domain.com', '/base/', {
        key0: 'value0',
        key1: null,
        key2: undefined,
        key3: 0,
        key4: ''
      })
    ).toBe('https://domain.com/base/?key0=value0&key3=0')
  })

  it('should should leave pathname', () => {
    expect(getUrl('https://domain.com/some/path/', '/base/')).toBe(
      'https://domain.com/some/path/base/'
    )
  })
})
