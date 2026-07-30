export {
  GIF2VIDEO_FORMATS,
  GIF2VIDEO_QUALITIES,
  type Gif2VideoFormat,
  type Gif2VideoQuality,
  format,
  quality
} from './operations'
export { gif2videoUrl } from './gif2video-url'
// Every url this entry builds needs a CDN base, so the helpers that derive one
// are re-exported here too — same symbols as the root entry, resolved to the same
// module, so nothing is duplicated in a bundle and nothing is paid for unless
// named. See `src/prefixed-cdn-base.ts`.
export { LEGACY_CDN_BASE, PREFIX_CDN_BASE } from '../cdn-base'
export { prefixedCdnBase, prefixedCdnBaseAsync } from '../prefixed-cdn-base'
