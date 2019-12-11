import * as factory from "../_fixtureFactory";
import { getSettingsForTesting } from "../_helpers";
import group from "../../src/api/group";
import CancelController from "../../src/CancelController";
import CancelError from '../../src/errors/CancelError'

describe("API - group", () => {
  const files = factory.groupOfFiles("valid");
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey("image")
  });

  it("should upload group of files", async () => {
    const data = await group(files, settings);

    expect(data).toBeTruthy();
    expect(data.id).toBeTruthy();
    expect(data.files).toBeTruthy();
  });

  it("should fail with [HTTP 400] no files[N] parameters found.", async () => {
    await expectAsync(group([], settings)).toBeRejectedWithError(Error);
  });

  it("should fail with [HTTP 400] this is not valid file url: http://invalid/url.", async () => {
    const files = factory.groupOfFiles("invalid");

    await expectAsync(group(files, settings)).toBeRejectedWithError(Error);
  });

  it("should fail with [HTTP 400] some files not found.", async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey("demo")
    });

    await expectAsync(group(files, settings)).toBeRejectedWithError(Error);
  });

  it("should be able to cancel uploading", async () => {
    let controller = new CancelController();

    const settings = getSettingsForTesting({
      publicKey: factory.publicKey("image"),
      cancel: controller
    });

    setTimeout(() => {
      controller.cancel();
    }, 10);

    await expectAsync(group(files, settings)).toBeRejectedWithError(CancelError());
  });
});
