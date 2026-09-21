/**
 * Decode a base64url segment to text.
 *
 * `atob` alone is not enough: base64url swaps two characters and drops the
 * padding, and it yields bytes rather than text, so a token carrying anything
 * outside ASCII would decode to mojibake without the `TextDecoder` pass.
 *
 * Deliberately not Node's `Buffer`, which would pull a polyfill into browser
 * bundles. `atob` and `TextDecoder` are global in browsers and in Node 16+.
 */
export const base64urlDecode = (segment: string): string => {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
