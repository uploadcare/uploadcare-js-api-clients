export const findExifOrientation = (
  exif: DataView,
  exifCallback: (offset: number, littleEndian: boolean) => void
) => {
  let j, little, offset, ref
  if (
    !exif ||
    exif.byteLength < 14 ||
    exif.getUint32(0) !== 0x45786966 ||
    exif.getUint16(4) !== 0
  ) {
    return
  }
  if (exif.getUint16(6) === 0x4949) {
    little = true
  } else if (exif.getUint16(6) === 0x4d4d) {
    little = false
  } else {
    return
  }
  if (exif.getUint16(8, little) !== 0x002a) {
    return
  }
  offset = 8 + exif.getUint32(10, little)
  const count = exif.getUint16(offset - 2, little)
  for (j = 0, ref = count; ref >= 0 ? j < ref : j > ref; ref >= 0 ? ++j : --j) {
    if (exif.byteLength < offset + 10) {
      return
    }
    if (exif.getUint16(offset, little) === 0x0112) {
      exifCallback(offset + 8, little)
    }
    offset += 12
  }
}
