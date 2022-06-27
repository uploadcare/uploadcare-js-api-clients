import { camelizeObject, camelize } from './case'

describe('camelize', () => {
  it('should work', () => {
    expect(camelize('foo_bar')).toBe('fooBar')
    expect(camelize('foo-bar')).toBe('fooBar')
    expect(camelize('foo.bar')).toBe('fooBar')
    expect(camelize('Foo_bar')).toBe('fooBar')
    expect(camelize('foo_bar_baz')).toBe('fooBarBaz')
  })
})

describe('camelizeObject', () => {
  it('should work', () => {
    const input = {
      foo_bar: 'test1',
      foo_bar_baz: 'test2',
      foo: 'test3',
      Foo_bar_baz_4: { one_more_thing: 'test4' },
      foo_bar5: [1, 2, 3, 4, 5],
      foo_bar6: [{ foo_bar: 'baz' }]
    }
    const expected = {
      fooBar: 'test1',
      fooBarBaz: 'test2',
      foo: 'test3',
      fooBarBaz4: { oneMoreThing: 'test4' },
      fooBar5: [1, 2, 3, 4, 5],
      fooBar6: [{ fooBar: 'baz' }]
    }
    expect(camelizeObject(input)).toEqual({
      expected
    })
  })
})
