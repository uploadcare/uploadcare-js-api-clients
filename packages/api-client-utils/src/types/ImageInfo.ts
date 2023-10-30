type GeoLocation = {
  latitude: number
  longitude: number
}

export type ImageInfo = {
  height: number
  width: number
  geoLocation: GeoLocation | null
  datetimeOriginal: string | null
  format: string
  colorMode: string
  dpi: {
    '0': number
    '1': number
  } | null
  orientation: number | null
  sequence: boolean | null
}
