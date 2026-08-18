import { expectTypeOf } from 'expect-type'
import {
  Camelize,
  camelizeKeys,
  camelizeString,
  SnakeCasedPropertiesDeep
} from './camelizeKeys'

type Source = {
  isReady: boolean
  imageInfo: { colorMode: string; dpi: readonly [number, number] }
  contentInfo: { videoInfo: { audioTracks: { sampleRate: number }[] } }
}

type Raw = {
  is_ready: boolean
  image_info: { color_mode: string; dpi: readonly [number, number] }
  content_info: { video_info: { audio_tracks: { sample_rate: number }[] } }
}

describe('SnakeCasedPropertiesDeep', () => {
  it('should rewrite keys at every level', () => {
    expectTypeOf<SnakeCasedPropertiesDeep<Source>>().toEqualTypeOf<Raw>()
  })

  it('should rewrite keys, not values', () => {
    expectTypeOf<
      SnakeCasedPropertiesDeep<{ mimeType: string }>
    >().toEqualTypeOf<{ mime_type: string }>()
    expectTypeOf<SnakeCasedPropertiesDeep<{ isImage: boolean }>>()
      .toHaveProperty('is_image')
      .toBeBoolean()
  })

  it('should keep digits attached rather than splitting them off', () => {
    expectTypeOf<
      SnakeCasedPropertiesDeep<{ s3Bucket: string }>
    >().toEqualTypeOf<{
      s3_bucket: string
    }>()
  })

  it('should keep tuple shape and readonly-ness', () => {
    expectTypeOf<
      SnakeCasedPropertiesDeep<{ dpi: readonly [number, number] }>['dpi']
    >().toEqualTypeOf<readonly [number, number]>()
    // A homomorphic mapped type is what preserves these: the previous
    // `SnakeCasedPropertiesDeep<U>[]` branch collapsed both to `number[]`.
    expectTypeOf<
      SnakeCasedPropertiesDeep<{ dpi: readonly [number, number] }>['dpi']
    >().not.toEqualTypeOf<number[]>()
  })

  it('should rewrite the element type of arrays of objects', () => {
    expectTypeOf<
      SnakeCasedPropertiesDeep<{ videoInfo: { bitRate: number } }[]>
    >().toEqualTypeOf<{ video_info: { bit_rate: number } }[]>()
  })

  it('should pass primitives and null through untouched', () => {
    expectTypeOf<SnakeCasedPropertiesDeep<string>>().toEqualTypeOf<string>()
    expectTypeOf<SnakeCasedPropertiesDeep<number>>().toEqualTypeOf<number>()
    expectTypeOf<SnakeCasedPropertiesDeep<null>>().toEqualTypeOf<null>()
  })
})

describe('camelizeKeys types', () => {
  it('should return the type the caller asks for', () => {
    expectTypeOf(camelizeKeys<Source>({} as Raw)).toEqualTypeOf<Source>()
  })

  it('should default to a plain record so untyped calls keep compiling', () => {
    expectTypeOf(camelizeKeys({ a_b: 1 })).toEqualTypeOf<
      Record<string, unknown>
    >()
  })

  it('should accept any input, since a raw frame is not typed yet', () => {
    expectTypeOf(camelizeKeys).parameter(0).toBeUnknown()
    expectTypeOf(camelizeKeys<Source>)
      .parameter(1)
      .toEqualTypeOf<{ ignoreKeys: string[] } | undefined>()
  })
})

describe('camelizeString types', () => {
  it('should report the camelCase literal, so constants can be derived', () => {
    expectTypeOf(
      camelizeString('non_field_errors')
    ).toEqualTypeOf<'nonFieldErrors'>()
    expectTypeOf<
      Camelize<'non_field_errors'>
    >().toEqualTypeOf<'nonFieldErrors'>()
  })

  it('should cover every separator the runtime splits on in API keys', () => {
    expectTypeOf<Camelize<'foo-bar'>>().toEqualTypeOf<'fooBar'>()
    expectTypeOf<Camelize<'foo.bar'>>().toEqualTypeOf<'fooBar'>()
    expectTypeOf<Camelize<'foo bar'>>().toEqualTypeOf<'fooBar'>()
    expectTypeOf<Camelize<'a__b'>>().toEqualTypeOf<'aB'>()
  })

  it('should lower only the first character of the first segment', () => {
    expectTypeOf<Camelize<'Foo_bar'>>().toEqualTypeOf<'fooBar'>()
    expectTypeOf<
      Camelize<'detected_MIME_type'>
    >().toEqualTypeOf<'detectedMIMEType'>()
  })

  it('should leave a separator-free string alone', () => {
    expectTypeOf<Camelize<'size'>>().toEqualTypeOf<'size'>()
    expectTypeOf<Camelize<'alreadyCamel'>>().toEqualTypeOf<'alreadyCamel'>()
  })

  it('should stay a string for a non-literal input', () => {
    // Not `toEqualTypeOf<string>`: with a non-literal argument the conditional
    // never reduces, and expect-type cannot equate a deferred type.
    expectTypeOf(camelizeString('' as string)).toBeString()
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
