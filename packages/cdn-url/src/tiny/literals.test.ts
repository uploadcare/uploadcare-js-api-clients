import { describe, expect, it } from 'vitest'

import {
  modifiers,
  normalizeModifiers,
  type OperationLiteral,
  unsafeOperation
} from './literals'
import * as ops from '../ops'
import { parseOperations, serializeOperations } from '../index'

/**
 * `OperationLiteral` restates the operation grammar the creators in `/ops` already
 * know, which is a drift risk: a typo in the union — `scalecrop/`, `stripmeta/` —
 * type-checks against nothing and only shows up in a broken URL.
 *
 * The fixture below is the guard, and it is checked twice. TypeScript checks every
 * entry against the union, so a shape the union rejects fails the build. Then the
 * tests check each entry against the library's own parser and against the set of
 * names the creators emit, so a name the CDN does not have fails at runtime.
 *
 * Add an operation to the union without adding it here and nothing breaks; add one
 * here that the union rejects, or that no creator emits, and this file fails.
 */
const SAMPLES: OperationLiteral[] = [
  'format/auto',
  'quality/lightest',
  'progressive/yes',
  'strip_meta/sensitive',
  'inline/no',
  'rasterize',
  'brightness/50',
  'exposure/-20',
  'gamma/120',
  'contrast/10',
  'saturation/15',
  'vibrance/25',
  'warmth/35',
  'enhance/30',
  'grayscale',
  'invert',
  'filter/adaris',
  'filter/adaris/70',
  'srgb/keep_profile',
  'max_icc_size/10',
  'blur',
  'blur/20',
  'blur/20/5',
  'sharp/10',
  'preview',
  'preview/800x600',
  'resize/300x',
  'resize/x200',
  'resize/300x200',
  'smart_resize/440x600',
  'stretch/off',
  'crop/640x480',
  'crop/640x480/10,20',
  'crop/640x480/center',
  'crop/16:9',
  'crop/16:9/center',
  'scale_crop/64x64',
  'scale_crop/64x64/center',
  'scale_crop/64x64/smart',
  'scale_crop/64x64/10,20',
  'border_radius/50%',
  'setfill/ffffff',
  'autorotate/no',
  'rotate/90',
  'flip',
  'mirror',
  'zoom_objects/50',
  'json',
  'jsonp/callbackName',
  'main_colors/4'
]

/** Every operation name the creators actually emit, via their `opName` tag. */
const CREATOR_NAMES = new Set(
  Object.values(ops)
    .filter(
      (value): value is { opName: string } =>
        typeof value === 'function' && 'opName' in value
    )
    .map((creator) => creator.opName)
)

describe('modifiers', () => {
  it('joins operations into a chain', () => {
    expect(modifiers('format/auto', 'progressive/yes')).toBe(
      '-/format/auto/-/progressive/yes/'
    )
  })

  it('returns an empty string for no operations', () => {
    expect(modifiers()).toBe('')
  })

  it('emits exactly what serializeOperations does for the same chain', () => {
    // The two APIs must be interchangeable, or a caller cannot mix a literal-built
    // chain with a parsed one.
    expect(modifiers('resize/300x', 'quality/smart')).toBe(
      serializeOperations([
        { name: 'resize', params: ['300x'] },
        { name: 'quality', params: ['smart'] }
      ])
    )
  })
})

describe('OperationLiteral', () => {
  it.each(SAMPLES)('%s parses as a single operation', (sample) => {
    const parsed = parseOperations(modifiers(sample))
    expect(parsed).toHaveLength(1)
    expect([parsed[0]?.name, ...(parsed[0]?.params ?? [])].join('/')).toBe(
      sample
    )
  })

  it.each(SAMPLES)('%s uses a name a creator also emits', (sample) => {
    const name = sample.split('/')[0]
    expect(CREATOR_NAMES).toContain(name)
  })

  it('round-trips the whole sample set through the parser', () => {
    const chain = modifiers(...SAMPLES)
    expect(serializeOperations(parseOperations(chain))).toBe(chain)
  })

  it('covers every creator name that takes no free-form argument', () => {
    // Operations whose parameters are a uuid, arbitrary text or a font spec cannot be
    // expressed as a template literal type — they are the documented reason
    // `unsafeOperation` exists. Everything else should be in the union, and this
    // fails if the library gains an operation the union has not caught up with.
    const inescapable = new Set([
      'overlay',
      'rect',
      'text',
      'text_align',
      'text_box',
      'font',
      'blur_region'
    ])
    const covered = new Set(SAMPLES.map((sample) => sample.split('/')[0]))
    const missing = [...CREATOR_NAMES].filter(
      (name) => !covered.has(name) && !inescapable.has(name)
    )
    expect(missing).toEqual([])
  })
})

describe('unsafeOperation', () => {
  it('passes a string through for operations the union cannot express', () => {
    const uuid = 'c2499162-eb07-4b93-b31e-94a89a47e858'
    expect(
      modifiers('preview', unsafeOperation(`overlay/${uuid}/50%x50%/center`))
    ).toBe(`-/preview/-/overlay/${uuid}/50%x50%/center/`)
  })
})

describe('normalizeModifiers', () => {
  // Every shape a stored, configured or hand-written value arrives in — the same
  // leniency parseOperations grants, canonicalized to one chain.
  const cases: [input: string, chain: string][] = [
    ['resize/100x', '-/resize/100x/'],
    ['-/resize/100x', '-/resize/100x/'],
    ['/resize/100x', '-/resize/100x/'],
    ['/resize/100x/', '-/resize/100x/'],
    ['-/resize/100x/', '-/resize/100x/'],
    ['//-/resize//100x//', '-/resize/100x/'],
    ['  -/resize/100x/  ', '-/resize/100x/'],
    ['resize/300x/-/blur/10', '-/resize/300x/-/blur/10/'],
    ['', ''],
    ['   ', ''],
    ['/', ''],
    ['preview', '-/preview/']
  ]

  for (const [input, chain] of cases) {
    it(`normalizes ${JSON.stringify(input)} to ${JSON.stringify(chain)}`, () => {
      expect(normalizeModifiers(input)).toBe(chain)
    })
  }

  /**
   * Collapsing runs of slashes is what makes the lenient shapes work, and it
   * reaches inside parameters — so a chain carrying an embedded url comes out
   * corrupted. Harmless within the file-url contract (a file chain never
   * legitimately contains `//`), pinned here so the behaviour is not a surprise
   * to whoever points this at a proxy chain.
   */
  it('collapses slashes inside parameters, embedded protocol included', () => {
    expect(normalizeModifiers('preview/https://example.com/')).toBe(
      '-/preview/https:/example.com/'
    )
  })

  it('is idempotent', () => {
    expect(normalizeModifiers(normalizeModifiers('resize/100x'))).toBe(
      '-/resize/100x/'
    )
  })

  it('agrees with modifiers() on a literal', () => {
    expect(normalizeModifiers('resize/100x')).toBe(modifiers('resize/100x'))
  })

  it('agrees with the full parser on what the chain contains', () => {
    expect(
      parseOperations(normalizeModifiers('resize/300x/-/blur/10'))
    ).toEqual(parseOperations('resize/300x/-/blur/10'))
  })
})
