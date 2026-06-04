import type { Alignment, SizeValue } from '../grammar'
import * as ops from '../ops/index'
import { Chain, type ChainState } from './chain-base'

/**
 * Every image transformation as a chainable method. Methods mirror the
 * creators from `@uploadcare/cdn-url/ops` one-to-one — same signatures, same
 * development-bundle validation — and return a new chain.
 *
 * @internal
 */
export abstract class ImageChain<S extends ChainState> extends Chain<S> {
  // Geometric ----------------------------------------------------------------
  /** Appends `preview`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public preview(width?: number, height?: number): this {
    return this._add(ops.preview(width, height))
  }
  /** Appends `resize`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public resize(dims: { width?: number; height?: number }): this {
    return this._add(ops.resize(dims))
  }
  /** Appends `smartResize`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public smartResize(width: number, height: number): this {
    return this._add(ops.smartResize(width, height))
  }
  /** Appends `stretch`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public stretch(mode: ops.StretchMode): this {
    return this._add(ops.stretch(mode))
  }
  /** Appends `crop`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public crop(width: SizeValue, height: SizeValue, align?: Alignment): this {
    return this._add(ops.crop(width, height, align))
  }
  /** Appends `cropByRatio`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public cropByRatio(ratio: string, align?: Alignment): this {
    return this._add(ops.cropByRatio(ratio, align))
  }
  /** Appends `cropByTag`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public cropByTag(
    tag: ops.CropTag,
    options?: {
      ratio?: string
      size?: [SizeValue, SizeValue]
      align?: Alignment
    }
  ): this {
    return this._add(ops.cropByTag(tag, options))
  }
  /** Appends `scaleCrop`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public scaleCrop(
    width: number,
    height: number,
    options?: { type?: ops.ScaleCropType; align?: Alignment }
  ): this {
    return this._add(ops.scaleCrop(width, height, options))
  }
  /** Appends `borderRadius`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public borderRadius(radii: ops.Radii, verticalRadii?: ops.Radii): this {
    return this._add(ops.borderRadius(radii, verticalRadii))
  }
  /** Appends `setfill`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public setfill(color: string): this {
    return this._add(ops.setfill(color))
  }
  /** Appends `zoomObjects`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public zoomObjects(zoom: number): this {
    return this._add(ops.zoomObjects(zoom))
  }
  /** Appends `autorotate`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public autorotate(enabled: boolean): this {
    return this._add(ops.autorotate(enabled))
  }
  /** Appends `rotate`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public rotate(angle: number): this {
    return this._add(ops.rotate(angle))
  }
  /** Appends `flip`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public flip(): this {
    return this._add(ops.flip())
  }
  /** Appends `mirror`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public mirror(): this {
    return this._add(ops.mirror())
  }

  // Effects ------------------------------------------------------------------
  /** Appends `brightness`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public brightness(value: number): this {
    return this._add(ops.brightness(value))
  }
  /** Appends `exposure`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public exposure(value: number): this {
    return this._add(ops.exposure(value))
  }
  /** Appends `gamma`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public gamma(value: number): this {
    return this._add(ops.gamma(value))
  }
  /** Appends `contrast`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public contrast(value: number): this {
    return this._add(ops.contrast(value))
  }
  /** Appends `saturation`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public saturation(value: number): this {
    return this._add(ops.saturation(value))
  }
  /** Appends `vibrance`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public vibrance(value: number): this {
    return this._add(ops.vibrance(value))
  }
  /** Appends `warmth`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public warmth(value: number): this {
    return this._add(ops.warmth(value))
  }
  /** Appends `enhance`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public enhance(strength?: number): this {
    return this._add(ops.enhance(strength))
  }
  /** Appends `grayscale`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public grayscale(): this {
    return this._add(ops.grayscale())
  }
  /** Appends `invert`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public invert(): this {
    return this._add(ops.invert())
  }
  /** Appends `filter`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public filter(name: ops.FilterName, amount?: number): this {
    return this._add(ops.filter(name, amount))
  }
  /** Appends `blur`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public blur(strength?: number, amount?: number): this {
    return this._add(ops.blur(strength, amount))
  }
  /** Appends `blurRegion`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public blurRegion(options: ops.BlurRegionOptions): this {
    return this._add(ops.blurRegion(options))
  }
  /** Appends `sharp`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public sharp(strength?: number): this {
    return this._add(ops.sharp(strength))
  }
  /** Appends `srgb`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public srgb(mode: ops.SrgbMode): this {
    return this._add(ops.srgb(mode))
  }
  /** Appends `maxIccSize`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public maxIccSize(kb: number): this {
    return this._add(ops.maxIccSize(kb))
  }
  /** Appends `mainColors`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public mainColors(count?: number): this {
    return this._add(ops.mainColors(count))
  }
  /** Appends `json`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public json(): this {
    return this._add(ops.json())
  }
  /** Appends `jsonp`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public jsonp(): this {
    return this._add(ops.jsonp())
  }

  // Compression & delivery ----------------------------------------------------
  /** Appends `format`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public format(value: ops.Format): this {
    return this._add(ops.format(value))
  }
  /** Appends `quality`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public quality(value: ops.Quality): this {
    return this._add(ops.quality(value))
  }
  /** Appends `progressive`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public progressive(enabled: boolean): this {
    return this._add(ops.progressive(enabled))
  }
  /** Appends `stripMeta`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public stripMeta(mode: ops.StripMetaMode): this {
    return this._add(ops.stripMeta(mode))
  }
  /** Appends `inline`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public inline(enabled: boolean): this {
    return this._add(ops.inline(enabled))
  }
  /** Appends `rasterize`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public rasterize(): this {
    return this._add(ops.rasterize())
  }

  // Overlays & text ------------------------------------------------------------
  /** Appends `overlay`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public overlay(
    source: ops.OverlaySource,
    options?: ops.OverlayOptions
  ): this {
    return this._add(ops.overlay(source, options))
  }
  /** Appends `rect`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public rect(
    color: string,
    size: [SizeValue, SizeValue],
    position: ops.RelativePoint
  ): this {
    return this._add(ops.rect(color, size, position))
  }
  /** Appends `text`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public text(
    size: [SizeValue, SizeValue],
    position: ops.RelativePoint,
    value: string
  ): this {
    return this._add(ops.text(size, position, value))
  }
  /** Appends `textAlign`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public textAlign(halign: ops.TextHAlign, valign: ops.TextVAlign): this {
    return this._add(ops.textAlign(halign, valign))
  }
  /** Appends `font`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public font(size: number, color?: string): this {
    return this._add(ops.font(size, color))
  }
  /** Appends `textBox`; mirrors the creator in `@uploadcare/cdn-url/ops`. */
  public textBox(
    mode: ops.TextBoxMode,
    color?: string,
    padding?: number
  ): this {
    return this._add(ops.textBox(mode, color, padding))
  }
}
