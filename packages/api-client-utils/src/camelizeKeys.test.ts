import { camelizeKeys, camelizeString } from './camelizeKeys'

describe('camelizeString', () => {
  it('should work', () => {
    expect(camelizeString('foo_bar')).toBe('fooBar')
    expect(camelizeString('foo-bar')).toBe('fooBar')
    expect(camelizeString('foo.bar')).toBe('fooBar')
    expect(camelizeString('Foo_bar')).toBe('fooBar')
    expect(camelizeString('foo_bar_baz')).toBe('fooBarBaz')
  })
})

describe('camelizeKeys', () => {
  it('should work', () => {
    expect(
      camelizeKeys({
        foo_bar: 'test1',
        foo_bar_baz: 'test2',
        foo: 'test3',
        Foo_bar_baz_4: { one_more_thing: 'test4' },
        foo_bar5: [1, 2, 3, 4, 5],
        foo_bar6: [{ foo_bar: 'baz' }]
      })
    ).toEqual({
      fooBar: 'test1',
      fooBarBaz: 'test2',
      foo: 'test3',
      fooBarBaz4: { oneMoreThing: 'test4' },
      fooBar5: [1, 2, 3, 4, 5],
      fooBar6: [{ fooBar: 'baz' }]
    })
  })

  it('should accept ignoreKeys argument', () => {
    expect(
      camelizeKeys(
        {
          foo_bar: 'test1',
          ignored_key: 'value',
          foo_bar2: {
            one_more_thing: 'test4',
            ignored_key: 'value'
          },
          foo_bar3: [1, 2, 3, 4, 5],
          foo_bar4: [
            {
              foo_bar: 'baz',
              ignored_key: 'value'
            }
          ]
        },
        { ignoreKeys: ['ignored_key'] }
      )
    ).toEqual({
      fooBar: 'test1',
      ignored_key: 'value',
      fooBar2: {
        oneMoreThing: 'test4',
        ignored_key: 'value'
      },
      fooBar3: [1, 2, 3, 4, 5],
      fooBar4: [{ fooBar: 'baz', ignored_key: 'value' }]
    })
  })

  it('should return passed argument if it is not an object', () => {
    expect(camelizeKeys('string')).toEqual('string')
    expect(camelizeKeys(100)).toEqual(100)
    expect(camelizeKeys(null)).toEqual(null)
    expect(camelizeKeys(undefined)).toEqual(undefined)
  })
})
