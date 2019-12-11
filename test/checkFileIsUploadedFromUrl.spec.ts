import * as factory from "./_fixtureFactory"
import checkFileIsUploadedFromUrl from "../src/checkFileIsUploadedFromUrl"
import { StatusEnum } from "../src/api/fromUrlStatus"
import { getSettingsForTesting } from "./_helpers"
import fromUrl from "../src/api/fromUrl"
import CancelError from "../src/errors/CancelError"
import TimeoutError from "../src/errors/TimeoutError"

describe("checkFileIsUploadedFromUrl", () => {
  const sourceUrl = factory.imageUrl("valid")
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey("demo")
  })

  it("should be resolved if file is uploaded", async () => {
    const data = await fromUrl(sourceUrl, settings)
    // @ts-ignore
    const { token } = data
    const info = await checkFileIsUploadedFromUrl({
      token,
      settings
    })

    expect(info.status).toBe(StatusEnum.Success)
  })

  it("should be cancelable", async () => {
    const data = await fromUrl(sourceUrl, settings)
    // @ts-ignore
    const { token } = data
    const polling = checkFileIsUploadedFromUrl({
      token,
      settings
    })
    const promise = polling

    polling.cancel()

    await (expectAsync(promise) as any).toBeRejectedWithError(CancelError)
  })

  it("should be rejected after timeout", async () => {
    const data = await fromUrl(sourceUrl, settings)
    // @ts-ignore
    const { token } = data
    const polling = checkFileIsUploadedFromUrl({
      token,
      settings,
      timeout: -1000
    })
    const promise = polling

    await (expectAsync(promise) as any).toBeRejectedWithError(TimeoutError)
  })
})
