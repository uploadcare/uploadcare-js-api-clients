import fromUrlStatus, { Status } from "../../src/api/fromUrlStatus"
import * as factory from "../_fixtureFactory"
import { getSettingsForTesting } from "../_helpers"
import CancelController from "../../src/CancelController"

describe("API - from url status", () => {
  const token = factory.token("valid")
  const settings = getSettingsForTesting()

  it("should return info about file uploaded from url", async () => {
    const data = await fromUrlStatus(token, settings)

    expect(data.status).toBeTruthy()

    if (data.status === Status.Progress || data.status === Status.Success) {
      expect(data.done).toBeTruthy()
      expect(data.total).toBeTruthy()
    } else if (data.status === Status.Error) {
      expect(data.error).toBeTruthy()
    }
  })

  it("should be rejected with empty token", async () => {
    const token = factory.token("empty")
    const upload = fromUrlStatus(token, settings)

    await (expectAsync(upload) as any).toBeRejectedWithError(Error)
  })

  it("should be able to cancel uploading", async () => {
    let controller = new CancelController()

    const settings = getSettingsForTesting({
      publicKey: factory.publicKey("demo"),
      cancel: controller
    })

    setTimeout(() => {
      controller.cancel()
    }, 10)

    await expectAsync(fromUrlStatus(token, settings)).toBeRejectedWithError(
      "cancel"
    )
  })
})
