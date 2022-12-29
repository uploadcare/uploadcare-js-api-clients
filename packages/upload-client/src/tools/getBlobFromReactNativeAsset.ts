import { ReactNativeAsset } from '../types'

const memo: WeakMap<ReactNativeAsset, Blob> = new WeakMap()

export const getBlobFromReactNativeAsset = async (
  asset: ReactNativeAsset
): Promise<Blob> => {
  if (memo.has(asset)) {
    return memo.get(asset) as Blob
  }
  const blob = await fetch(asset.uri).then((res) => res.blob())
  memo.set(asset, blob)
  return blob
}
