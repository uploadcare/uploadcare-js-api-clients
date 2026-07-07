/**
 * Entry for the IIFE/global build (`dist/cdn-url.global.js`): everything the
 * package offers behind a single `UCCdnUrl` global, for `<script>`-tag usage
 * without a bundler.
 *
 * @example
 * ```html
 * <script src="https://unpkg.com/@uploadcare/cdn-url/dist/cdn-url.global.js"></script>
 * <script>
 *   UCCdnUrl.cdn.file(uuid).preview(800, 600).href
 *   UCCdnUrl.parseCdnUrl(url)
 * </script>
 * ```
 */
export * from './index'
export * as ops from './ops/index'
export * as video from './video/index'
export * as document from './document/index'
export * as gif2video from './gif2video/index'
export * as group from './group/index'
export * as proxy from './proxy/index'
export * as validate from './validate/index'
export { CdnUrl } from './builder/index'
export * from './fluent/index'
