import getUrl from '../../src/tools/getUrl'

describe('create URL', () => {
  it('should create url', () => {
    expect(getUrl('https://github.com', '/base/')).toBe(
      'https://github.com/base/'
    )
  })

  it('should work with query', () => {
    expect(
      getUrl('https://github.com', '/base/', { lol: 'param', kek: 'param' })
    ).toBe('https://github.com/base/?lol=param&kek=param')
  })

  it('should accept arrays', () => {
    expect(
      getUrl('https://github.com', '/base/', {
        lol: 'param',
        kek: ['param1', 'param2']
      })
    ).toBe('https://github.com/base/?lol=param&kek[]=param1&kek[]=param2')
  })

  it('should escape url', () => {
    expect(
      getUrl('https://github.com', '/base/', {
        lol: 'https://github.com'
      })
    ).toBe('https://github.com/base/?lol=https%3A%2F%2Fgithub.com')
  })

  it('should accept objects', () => {
    expect(
      getUrl('https://github.com', '/base/', {
        lol: 'param',
        kek: {
          key1: 'value1',
          key2: 2,
          key3: undefined,
          key4: null as never
        }
      })
    ).toBe(
      'https://github.com/base/?lol=param&kek[key1]=value1&kek[key2]=2&kek[key4]=null'
    )
  })
})
