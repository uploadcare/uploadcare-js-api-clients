import { conversionPath } from '../conversion-path'
import { trimTrailingSlashes } from '../grammar'
import { parseGroupId } from '../group/group-id'
import { archiveUrl } from '../group/group-urls'
import type { ArchiveFormat } from '../group/group-urls'
import * as docOps from '../document/operations'
import * as gifOps from '../gif2video/operations'
import * as videoOps from '../video/operations'
import { serializeCdnUrl } from '../serialize'
import type { GroupId } from '../types'
import { Chain, type ChainState } from './chain-base'
import { ImageChain } from './image-chain'

/** @internal */
interface FileState extends ChainState {
  origin: string
  uuid: string
  filename: string | null
  search: string
  hash: string
}

/** A chainable single-file CDN url. */
export class FileChain extends ImageChain<FileState> {
  /** Discriminant for chains returned by `cdn.parse`. */
  public readonly kind = 'file' as const

  /** Rebases the chain onto another origin. */
  public on(origin: string): this {
    return this._next({ origin })
  }

  /** Sets (or clears) the trailing filename. */
  public filename(filename: string | null): this {
    return this._next({ filename })
  }

  /** The serialized URL. */
  public get href(): string {
    return serializeCdnUrl(this._s)
  }

  /** Alias of the terminal getter for string coercion. */
  public toString(): string {
    return this.href
  }
}

/** @internal */
interface GroupState {
  origin: string
  group: GroupId
  search: string
  hash: string
}

/** A chainable group root url — element access and archives only. */
export class GroupChain {
  /** Discriminant for chains returned by `cdn.parse`. */
  public readonly kind = 'group' as const

  /** @internal */
  public constructor(private readonly _s: GroupState) {}

  /** Rebases the chain onto another origin. */
  public on(origin: string): GroupChain {
    return new GroupChain({ ...this._s, origin })
  }

  /** Addresses a single file in the group (zero-based). */
  public nth(index: number): GroupElementChain {
    if (
      __DEV__ &&
      (!Number.isInteger(index) || index < 0 || index >= this._s.group.count)
    ) {
      throw new RangeError(
        `Group element index ${index} is out of range 0..${this._s.group.count - 1}`
      )
    }
    return new GroupElementChain({
      origin: this._s.origin,
      group: this._s.group,
      nth: index,
      operations: [],
      filename: null,
      search: this._s.search,
      hash: this._s.hash
    })
  }

  /** Archive url for the whole group (originals only). */
  public archive(format: ArchiveFormat, filename?: string): string {
    return archiveUrl(this._s.origin, this._s.group, format, filename)
  }

  /** The group root URL. */
  public get href(): string {
    return serializeCdnUrl({ origin: this._s.origin, group: this._s.group })
  }

  /** Alias of the terminal getter for string coercion. */
  public toString(): string {
    return this.href
  }
}

/** @internal */
interface GroupElementState extends ChainState {
  origin: string
  group: GroupId
  nth: number
  filename: string | null
  search: string
  hash: string
}

/** A chainable group element — full image operation surface. */
export class GroupElementChain extends ImageChain<GroupElementState> {
  /** Discriminant for chains returned by `cdn.parse`. */
  public readonly kind = 'group-element' as const

  /** Rebases the chain onto another origin. */
  public on(origin: string): this {
    return this._next({ origin })
  }

  /** Sets (or clears) the trailing filename. */
  public filename(filename: string | null): this {
    return this._next({ filename })
  }

  /** The serialized URL. */
  public get href(): string {
    return serializeCdnUrl(this._s)
  }

  /** Alias of the terminal getter for string coercion. */
  public toString(): string {
    return this.href
  }
}

/** @internal */
interface ProxyState extends ChainState {
  origin: string
  sourceUrl: string
}

/** A chainable delivery-proxy url over a remote source. */
export class ProxyChain extends ImageChain<ProxyState> {
  /** Discriminant for chains returned by `cdn.parse`. */
  public readonly kind = 'proxy' as const

  /** Rebases the chain onto another proxy endpoint. */
  public on(endpoint: string): this {
    return this._next({ origin: trimTrailingSlashes(endpoint) })
  }

  /** The serialized URL. */
  public get href(): string {
    return serializeCdnUrl(this._s)
  }

  /** Alias of the terminal getter for string coercion. */
  public toString(): string {
    return this.href
  }
}

/** @internal */
interface ConversionState extends ChainState {
  uuid: string
}

/** A chainable video conversion path for `POST /convert/video/`. */
export class VideoChain extends Chain<ConversionState> {
  /** Appends `size`; mirrors the creator in the matching conversion entry. */
  public size(options: {
    width?: number
    height?: number
    mode?: videoOps.VideoResizeMode
  }): this {
    return this._add(videoOps.size(options))
  }
  /** Appends `quality`; mirrors the creator in the matching conversion entry. */
  public quality(value: videoOps.VideoQuality): this {
    return this._add(videoOps.quality(value))
  }
  /** Appends `format`; mirrors the creator in the matching conversion entry. */
  public format(value: videoOps.VideoFormat): this {
    return this._add(videoOps.format(value))
  }
  /** Appends `cut`; mirrors the creator in the matching conversion entry. */
  public cut(startTime: string, length: string): this {
    return this._add(videoOps.cut(startTime, length))
  }
  /** Appends `thumbs`; mirrors the creator in the matching conversion entry. */
  public thumbs(count: number, options?: { fromFirstFrame?: boolean }): this {
    return this._add(videoOps.thumbs(count, options))
  }

  /** The domain-less REST conversion path. */
  public get path(): string {
    return conversionPath('video', this._s.uuid, this._s.operations)
  }

  /** Alias of the terminal getter for string coercion. */
  public toString(): string {
    return this.path
  }
}

/** A chainable document conversion path for `POST /convert/document/`. */
export class DocumentChain extends Chain<ConversionState> {
  /** Appends `format`; mirrors the creator in the matching conversion entry. */
  public format(target: docOps.DocumentTarget): this {
    return this._add(docOps.format(target))
  }
  /** Appends `page`; mirrors the creator in the matching conversion entry. */
  public page(number: number): this {
    return this._add(docOps.page(number))
  }

  /** The domain-less REST conversion path. */
  public get path(): string {
    return conversionPath('document', this._s.uuid, this._s.operations)
  }

  /** Alias of the terminal getter for string coercion. */
  public toString(): string {
    return this.path
  }
}

/** @internal */
interface Gif2VideoState extends ChainState {
  origin: string
  uuid: string
}

/** A chainable on-the-fly gif2video CDN url. */
export class Gif2VideoChain extends Chain<Gif2VideoState> {
  /** Appends `format`; mirrors the creator in the matching conversion entry. */
  public format(value: gifOps.Gif2VideoFormat): this {
    return this._add(gifOps.format(value))
  }
  /** Appends `quality`; mirrors the creator in the matching conversion entry. */
  public quality(value: gifOps.Gif2VideoQuality): this {
    return this._add(gifOps.quality(value))
  }

  /** Rebases the chain onto another origin. */
  public on(origin: string): this {
    return this._next({ origin })
  }

  /** The serialized URL. */
  public get href(): string {
    return serializeCdnUrl({
      origin: this._s.origin,
      uuid: this._s.uuid,
      conversion: 'gif2video',
      operations: this._s.operations
    })
  }

  /** Alias of the terminal getter for string coercion. */
  public toString(): string {
    return this.href
  }
}

/** Group input accepted by `cdn.group`: `uuid~count` string or a parsed id. */
export type GroupInput = string | GroupId

/** @internal */
export function toGroupId(input: GroupInput): GroupId {
  return typeof input === 'string' ? parseGroupId(input) : input
}
