/// <reference types="vite/client" />
import {
  ImageMagick,
  Magick,
  MagickFormat,
  Quantum,
  initializeImageMagick
} from '@imagemagick/magick-wasm'
// eslint-disable-next-line import/no-unresolved
import wasmUrl from '@imagemagick/magick-wasm/magick.wasm?url'

export const loadImageMagick = async () => {
  const wasmBytes = await fetch(wasmUrl).then((res) => res.arrayBuffer())
  await initializeImageMagick(wasmBytes)

  return { Magick, MagickFormat, Quantum, ImageMagick }
}
