import base from "../../src/api/base";
import * as factory from "../_fixtureFactory";
import { getSettingsForTesting } from "../_helpers";
import CancelController from "../../src/CancelController";

describe("API - base", () => {
  const fileToUpload = factory.image("blackSquare");

  it("should be able to upload data", async () => {
    const publicKey = factory.publicKey("demo");
    const { file } = await base(fileToUpload.data, { publicKey });

    expect(typeof file).toBe("string");
  });

  it("should be able to cancel uploading", async () => {
    let timeoutId;
    let timeout = jasmine.createSpy("timeout");
    const publicKey = factory.publicKey("demo");
    const controller = new CancelController();
    const directUpload = base(fileToUpload.data, {
      publicKey,
      cancel: controller
    });

    controller.cancel();

    timeoutId = setTimeout(timeout, 10);

    await expectAsync(directUpload).toBeRejectedWithError("cancel");

    expect(timeout).not.toHaveBeenCalled();
    clearTimeout(timeoutId);
  });

  it("should be able to handle progress", async () => {
    const publicKey = factory.publicKey("demo");
    const onProgress = jasmine.createSpy("onProgress");

    await base(fileToUpload.data, { publicKey, onProgress });

    expect(onProgress).toHaveBeenCalled();
  });
});
