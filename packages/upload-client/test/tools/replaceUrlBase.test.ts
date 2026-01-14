import { replaceUrlBase } from '../../src/tools/replaceUrlBase'

describe('replaceUrlBase', () => {
  it('replaces protocol, host and port while keeping path, query and hash', () => {
    expect(
      replaceUrlBase(
        'https://old.example.com:1234/path/to/resource?query=1#hash',
        'http://new.example.com:8080'
      )
    ).toBe('http://new.example.com:8080/path/to/resource?query=1#hash')
  })

  it('drops port when new base has none', () => {
    expect(
      replaceUrlBase(
        'https://old.example.com:3000/path/to/resource?query=1#hash',
        'https://new.example.com'
      )
    ).toBe('https://new.example.com/path/to/resource?query=1#hash')
  })

  it('returns original string on invalid input', () => {
    expect(replaceUrlBase('not-a-url', 'https://new.example.com')).toBe(
      'not-a-url'
    )
  })

  it('replaces base with Uploadcare CDN domain', () => {
    expect(
      replaceUrlBase(
        'https://ucarecdn.com/12345678-9abc-def0-1234-56789abcdef0/-/preview/',
        'https://1s4oyld5dc.ucarecd.net'
      )
    ).toBe(
      'https://1s4oyld5dc.ucarecd.net/12345678-9abc-def0-1234-56789abcdef0/-/preview/'
    )
  })

  it('preserves transformations when switching Uploadcare domains', () => {
    expect(
      replaceUrlBase(
        'https://1s4oyld5dc.ucarecd.net/12345678-9abc-def0-1234-56789abcdef0/-/resize/640x/',
        'https://ucarecdn.com'
      )
    ).toBe(
      'https://ucarecdn.com/12345678-9abc-def0-1234-56789abcdef0/-/resize/640x/'
    )
  })
})
