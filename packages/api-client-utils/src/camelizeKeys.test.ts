import {
  camelizeKeys,
  camelizeString,
  SnakeCasedPropertiesDeep
} from './camelizeKeys'

describe('SnakeCasedPropertiesDeep', () => {
  it('should rewrite nested keys and keep collection shapes', () => {
    type Source = {
      isReady: boolean
      imageInfo: { colorMode: string; dpi: readonly [number, number] }
      contentInfo: { videoInfo: { audioTracks: { sampleRate: number }[] } }
    }

    type Expected = {
      is_ready: boolean
      image_info: { color_mode: string; dpi: readonly [number, number] }
      content_info: { video_info: { audio_tracks: { sample_rate: number }[] } }
    }

    const raw: SnakeCasedPropertiesDeep<Source> = {
      is_ready: true,
      image_info: { color_mode: 'RGB', dpi: [72, 72] },
      content_info: { video_info: { audio_tracks: [{ sample_rate: 44100 }] } }
    }
    // Assignable both ways, so widening the tuple to number[] or dropping its
    // readonly would fail to compile rather than pass silently.
    const asExpected: Expected = raw
    const fromExpected: SnakeCasedPropertiesDeep<Source> = asExpected
    void fromExpected

    expect(camelizeKeys<Source>(raw)).toEqual({
      isReady: true,
      imageInfo: { colorMode: 'RGB', dpi: [72, 72] },
      contentInfo: { videoInfo: { audioTracks: [{ sampleRate: 44100 }] } }
    })
  })
})

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
  it('should camelize objects', () => {
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

  it('should camelize array items', () => {
    expect(
      camelizeKeys([
        'foo_bar',
        1,
        { one_more_thing: 'test4' },
        [{ foo_bar: 'baz' }]
      ])
    ).toEqual(['foo_bar', 1, { oneMoreThing: 'test4' }, [{ fooBar: 'baz' }]])
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

  it('should return passed argument if it is not an object or array', () => {
    expect(camelizeKeys('string')).toEqual('string')
    expect(camelizeKeys(100)).toEqual(100)
    expect(camelizeKeys(null)).toEqual(null)
    expect(camelizeKeys(undefined)).toEqual(undefined)
  })
})
