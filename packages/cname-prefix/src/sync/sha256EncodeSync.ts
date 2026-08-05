const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
] as const

const INITIAL_STATE: readonly number[] = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
  0x1f83d9ab, 0x5be0cd19
]

const rotr = (x: number, n: number): number => (x >>> n) | (x << (32 - n))

/**
 * SHA-256 of a UTF-8 string, as a 256-bit bigint.
 *
 * Deliberately rolled rather than unrolled: this hashes a public key — well
 * under a kilobyte, once per process — so the size of the code matters and its
 * throughput does not. Deriving the bigint straight from the state words also
 * skips the intermediate hex string the previous implementation built, which
 * was the largest part of it.
 *
 * Correctness is pinned by `sha256EncodeSync.test.ts` against digests generated
 * with `node:crypto`, covering every padding and multi-block boundary. The
 * implementation this replaced was wrong for inputs over 55 bytes: it vendored
 * `js-sha256` without the flag that resets the block buffer between blocks, so
 * later blocks were OR-ed into stale words.
 */
export function sha256EncodeSync(message: string): bigint {
  const bytes = new TextEncoder().encode(message)

  // message ‖ 0x80 ‖ zero padding ‖ 64-bit big-endian bit length, rounded up to
  // whole 64-byte blocks.
  const padded = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6)
  padded.set(bytes)
  padded[bytes.length] = 0x80

  const view = new DataView(padded.buffer)
  // Two 32-bit writes rather than one `setBigUint64`: that method's support in
  // Hermes is unconfirmed, and this build is the one React Native runs.
  const bitLength = bytes.length * 8
  view.setUint32(padded.length - 8, Math.floor(bitLength / 2 ** 32))
  view.setUint32(padded.length - 4, bitLength >>> 0)

  const state = [...INITIAL_STATE]
  const w = new Uint32Array(64)

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4)
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15] as number
      const y = w[i - 2] as number
      w[i] =
        ((w[i - 16] as number) +
          (rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3)) +
          (w[i - 7] as number) +
          (rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10))) >>>
        0
    }

    let a = state[0] as number
    let b = state[1] as number
    let c = state[2] as number
    let d = state[3] as number
    let e = state[4] as number
    let f = state[5] as number
    let g = state[6] as number
    let h = state[7] as number

    for (let i = 0; i < 64; i++) {
      const t1 =
        (h +
          (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) +
          ((e & f) ^ (~e & g)) +
          K[i]! +
          (w[i] as number)) >>>
        0
      const t2 =
        ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) +
          ((a & b) ^ (a & c) ^ (b & c))) >>>
        0
      h = g
      g = f
      f = e
      e = (d + t1) >>> 0
      d = c
      c = b
      b = a
      a = (t1 + t2) >>> 0
    }

    const round = [a, b, c, d, e, f, g, h]
    for (let i = 0; i < 8; i++) {
      state[i] = ((state[i] as number) + (round[i] as number)) >>> 0
    }
  }

  let digest = 0n
  for (const word of state) digest = (digest << 32n) | BigInt(word)
  return digest
}
