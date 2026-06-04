import { describe, expect, it } from 'vitest'

import {
  autorotate,
  blur,
  blurRegion,
  borderRadius,
  brightness,
  contrast,
  crop,
  cropByRatio,
  cropByTag,
  enhance,
  exposure,
  filter,
  flip,
  format,
  gamma,
  grayscale,
  inline,
  invert,
  json,
  overlay,
  mainColors,
  maxIccSize,
  mirror,
  preview,
  progressive,
  quality,
  rasterize,
  rawOp,
  rect,
  resize,
  rotate,
  saturation,
  scaleCrop,
  setfill,
  sharp,
  smartResize,
  srgb,
  stretch,
  stripMeta,
  text,
  vibrance,
  warmth,
  zoomObjects
} from './index'

describe('geometric operations', () => {
  it('preview without dimensions', () => {
    expect(preview()).toEqual({ name: 'preview', params: [] })
  })

  it('preview with dimensions', () => {
    expect(preview(1000, 400)).toEqual({
      name: 'preview',
      params: ['1000x400']
    })
  })

  it('resize with one or both dimensions', () => {
    expect(resize({ width: 320 })).toEqual({ name: 'resize', params: ['320x'] })
    expect(resize({ height: 240 })).toEqual({
      name: 'resize',
      params: ['x240']
    })
    expect(resize({ width: 320, height: 240 })).toEqual({
      name: 'resize',
      params: ['320x240']
    })
  })

  it('resize requires at least one dimension', () => {
    expect(() => resize({})).toThrow(TypeError)
  })

  it('smartResize requires both dimensions', () => {
    expect(smartResize(320, 240)).toEqual({
      name: 'smart_resize',
      params: ['320x240']
    })
  })

  it('stretch accepts only valid modes', () => {
    expect(stretch('off')).toEqual({ name: 'stretch', params: ['off'] })
    expect(stretch('fill')).toEqual({ name: 'stretch', params: ['fill'] })
    // @ts-expect-error invalid mode
    expect(() => stretch('nope')).toThrow(RangeError)
  })

  it('crop by size with default and explicit alignment', () => {
    expect(crop(640, 480)).toEqual({ name: 'crop', params: ['640x480'] })
    expect(crop(640, 480, 'center')).toEqual({
      name: 'crop',
      params: ['640x480', 'center']
    })
    expect(crop(640, 480, { x: 50, y: 100 })).toEqual({
      name: 'crop',
      params: ['640x480', '50,100']
    })
  })

  it('crop accepts percent dimensions and negative pixel offsets', () => {
    expect(crop('50p', '50p', { x: -20, y: 0 })).toEqual({
      name: 'crop',
      params: ['50px50p', '-20,0']
    })
  })

  it('cropByRatio validates the N:M grammar', () => {
    expect(cropByRatio('4:3')).toEqual({ name: 'crop', params: ['4:3'] })
    expect(cropByRatio('16:9', 'bottom')).toEqual({
      name: 'crop',
      params: ['16:9', 'bottom']
    })
    expect(() => cropByRatio('4x3')).toThrow(RangeError)
    expect(() => cropByRatio('0:3')).toThrow(RangeError)
  })

  it('cropByTag builds object-aware crops', () => {
    expect(cropByTag('face')).toEqual({ name: 'crop', params: ['face'] })
    expect(cropByTag('face', { ratio: '1:1' })).toEqual({
      name: 'crop',
      params: ['face', '1:1']
    })
    expect(
      cropByTag('image', { size: ['150p', '150p'], align: 'center' })
    ).toEqual({
      name: 'crop',
      params: ['image', '150px150p', 'center']
    })
  })

  it('scaleCrop with alignment or smart type', () => {
    expect(scaleCrop(100, 100)).toEqual({
      name: 'scale_crop',
      params: ['100x100']
    })
    expect(scaleCrop(100, 100, { align: 'center' })).toEqual({
      name: 'scale_crop',
      params: ['100x100', 'center']
    })
    expect(scaleCrop(1252, 670, { type: 'smart' })).toEqual({
      name: 'scale_crop',
      params: ['1252x670', 'smart']
    })
    expect(
      scaleCrop(100, 100, { type: 'smart_faces_objects', align: 'center' })
    ).toEqual({
      name: 'scale_crop',
      params: ['100x100', 'smart_faces_objects', 'center']
    })
    // @ts-expect-error invalid smart type
    expect(() => scaleCrop(10, 10, { type: 'smart_nonsense' })).toThrow(
      RangeError
    )
  })

  it('borderRadius accepts numbers, percent strings and per-corner lists', () => {
    expect(borderRadius(10)).toEqual({ name: 'border_radius', params: ['10'] })
    expect(borderRadius('50p')).toEqual({
      name: 'border_radius',
      params: ['50p']
    })
    expect(borderRadius([10, 20, 30, 40])).toEqual({
      name: 'border_radius',
      params: ['10,20,30,40']
    })
    expect(borderRadius([10, 20], ['5p', 0])).toEqual({
      name: 'border_radius',
      params: ['10,20', '5p,0']
    })
    expect(() => borderRadius([1, 2, 3, 4, 5])).toThrow(RangeError)
  })

  it('setfill validates hex colors', () => {
    expect(setfill('8d8578')).toEqual({ name: 'setfill', params: ['8d8578'] })
    expect(setfill('9f9')).toEqual({ name: 'setfill', params: ['9f9'] })
    expect(setfill('99ff9920')).toEqual({
      name: 'setfill',
      params: ['99ff9920']
    })
    expect(() => setfill('#9f9')).toThrow(RangeError)
    expect(() => setfill('red')).toThrow(RangeError)
  })

  it('zoomObjects validates the 1..100 range', () => {
    expect(zoomObjects(42)).toEqual({ name: 'zoom_objects', params: ['42'] })
    expect(() => zoomObjects(0)).toThrow(RangeError)
    expect(() => zoomObjects(101)).toThrow(RangeError)
  })

  it('rotation family', () => {
    expect(autorotate(false)).toEqual({ name: 'autorotate', params: ['no'] })
    expect(rotate(270)).toEqual({ name: 'rotate', params: ['270'] })
    expect(() => rotate(45)).toThrow(RangeError)
    expect(flip()).toEqual({ name: 'flip', params: [] })
    expect(mirror()).toEqual({ name: 'mirror', params: [] })
  })
})

describe('effects and enhancements', () => {
  it('color adjustments validate documented ranges', () => {
    expect(brightness(-100)).toEqual({ name: 'brightness', params: ['-100'] })
    expect(() => brightness(101)).toThrow(RangeError)
    expect(exposure(500)).toEqual({ name: 'exposure', params: ['500'] })
    expect(() => exposure(-501)).toThrow(RangeError)
    expect(gamma(1000)).toEqual({ name: 'gamma', params: ['1000'] })
    expect(() => gamma(-1)).toThrow(RangeError)
    expect(contrast(500)).toEqual({ name: 'contrast', params: ['500'] })
    expect(saturation(-100)).toEqual({ name: 'saturation', params: ['-100'] })
    expect(vibrance(250)).toEqual({ name: 'vibrance', params: ['250'] })
    expect(warmth(100)).toEqual({ name: 'warmth', params: ['100'] })
  })

  it('enhance defaults to no param and validates 0..100', () => {
    expect(enhance()).toEqual({ name: 'enhance', params: [] })
    expect(enhance(75)).toEqual({ name: 'enhance', params: ['75'] })
    expect(() => enhance(101)).toThrow(RangeError)
  })

  it('grayscale and invert take no params', () => {
    expect(grayscale()).toEqual({ name: 'grayscale', params: [] })
    expect(invert()).toEqual({ name: 'invert', params: [] })
  })

  it('filter validates preset names and amount range', () => {
    expect(filter('iothari')).toEqual({ name: 'filter', params: ['iothari'] })
    expect(filter('vevera', 150)).toEqual({
      name: 'filter',
      params: ['vevera', '150']
    })
    expect(() => filter('nonexistent')).toThrow(RangeError)
    expect(() => filter('iothari', 201)).toThrow(RangeError)
  })

  it('blur with strength and amount', () => {
    expect(blur()).toEqual({ name: 'blur', params: [] })
    expect(blur(20)).toEqual({ name: 'blur', params: ['20'] })
    expect(blur(20, -150)).toEqual({ name: 'blur', params: ['20', '-150'] })
    expect(() => blur(5001)).toThrow(RangeError)
    expect(() => blur(10, 101)).toThrow(RangeError)
  })

  it('blurRegion supports region and faces variants', () => {
    expect(blurRegion({ width: 100, height: 50, x: 10, y: 20 })).toEqual({
      name: 'blur_region',
      params: ['100x50', '10,20']
    })
    expect(
      blurRegion({ width: 100, height: 50, x: 10, y: 20, strength: 30 })
    ).toEqual({
      name: 'blur_region',
      params: ['100x50', '10,20', '30']
    })
    expect(blurRegion({ faces: true })).toEqual({
      name: 'blur_region',
      params: ['faces']
    })
    expect(blurRegion({ faces: true, strength: 40 })).toEqual({
      name: 'blur_region',
      params: ['faces', '40']
    })
  })

  it('sharp validates 0..20', () => {
    expect(sharp()).toEqual({ name: 'sharp', params: [] })
    expect(sharp(20)).toEqual({ name: 'sharp', params: ['20'] })
    expect(() => sharp(21)).toThrow(RangeError)
  })

  it('color profile handling', () => {
    expect(srgb('icc')).toEqual({ name: 'srgb', params: ['icc'] })
    expect(maxIccSize(20)).toEqual({ name: 'max_icc_size', params: ['20'] })
  })

  it('info operations', () => {
    expect(mainColors()).toEqual({ name: 'main_colors', params: [] })
    expect(mainColors(8)).toEqual({ name: 'main_colors', params: ['8'] })
    expect(json()).toEqual({ name: 'json', params: [] })
  })
})

describe('compression operations', () => {
  it('format validates the enum', () => {
    expect(format('auto')).toEqual({ name: 'format', params: ['auto'] })
    expect(format('preserve')).toEqual({ name: 'format', params: ['preserve'] })
    // @ts-expect-error invalid format
    expect(() => format('bmp')).toThrow(RangeError)
  })

  it('quality validates the enum', () => {
    expect(quality('smart')).toEqual({ name: 'quality', params: ['smart'] })
    expect(quality('smart_retina')).toEqual({
      name: 'quality',
      params: ['smart_retina']
    })
    expect(quality('lightest')).toEqual({
      name: 'quality',
      params: ['lightest']
    })
    // @ts-expect-error invalid quality
    expect(() => quality('ultra')).toThrow(RangeError)
  })

  it('progressive and stripMeta', () => {
    expect(progressive(true)).toEqual({ name: 'progressive', params: ['yes'] })
    expect(stripMeta('sensitive')).toEqual({
      name: 'strip_meta',
      params: ['sensitive']
    })
  })

  it('inline and rasterize', () => {
    expect(inline(false)).toEqual({ name: 'inline', params: ['no'] })
    expect(rasterize()).toEqual({ name: 'rasterize', params: [] })
  })
})

describe('overlays and text', () => {
  const OVERLAY_UUID = 'b18b5179-b9f6-4fdc-9920-5539f938fc44'

  it('overlay with uuid only', () => {
    expect(overlay(OVERLAY_UUID)).toEqual({
      name: 'overlay',
      params: [OVERLAY_UUID]
    })
  })

  it('overlay self with size, position and opacity', () => {
    expect(
      overlay('self', {
        size: ['50p', '50p'],
        position: ['10p', '90p'],
        opacity: '40p'
      })
    ).toEqual({
      name: 'overlay',
      params: ['self', '50px50p', '10p,90p', '40p']
    })
  })

  it('overlay with uuid and full params', () => {
    expect(
      overlay(OVERLAY_UUID, {
        size: ['35p', '35p'],
        position: 'center',
        opacity: '20p'
      })
    ).toEqual({
      name: 'overlay',
      params: [OVERLAY_UUID, '35px35p', 'center', '20p']
    })
  })

  it('rect builds color, size and position params', () => {
    expect(rect('9f9', ['50p', '33p'], 'center')).toEqual({
      name: 'rect',
      params: ['9f9', '50px33p', 'center']
    })
  })

  it('text escapes /, newline and tilde in the string', () => {
    expect(text(['80p', '20p'], 'bottom', 'a/b~c\nd')).toEqual({
      name: 'text',
      params: ['80px20p', 'bottom', 'a~sb~~c~nd']
    })
  })
})

describe('rawOp escape hatch', () => {
  it('builds arbitrary operations without validation', () => {
    expect(rawOp('@clib', 'pkg', '1.0.0')).toEqual({
      name: '@clib',
      params: ['pkg', '1.0.0']
    })
    expect(rawOp('future_op')).toEqual({ name: 'future_op', params: [] })
  })
})
