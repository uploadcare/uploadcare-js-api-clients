import request from "../../src/api/request/request";
import { buildFormData } from "../../src/api/request/buildFormData";
import * as factory from "../_fixtureFactory";
import { getSettingsForTesting, sleep } from "../_helpers";
import RequestWasThrottledError from "../../src/errors/RequestWasThrottledError";
import RequestError from "../../src/errors/RequestError";
import UploadcareError from "../../src/errors/UploadcareError";
import CancelError from "../../src/errors/CancelError";

describe("buildFormData", () => {
  it("should return FormData with nice input object", () => {
    const file = factory.image("blackSquare").data;
    const body = {
      file,
      UPLOADCARE_PUB_KEY: factory.publicKey("demo")
    };

    const data = buildFormData(body);

    expect(data).toBeDefined();
    expect(typeof data).toBe("object");
    expect(typeof data.append).toBe("function");
  });
});

describe("API – request", () => {
  const settings = getSettingsForTesting();

  describe("should be resolved", () => {
    it("on valid GET request", async () => {
      const options = {
        baseURL: settings.baseURL,
        path: "/info/",
        query: {
          pub_key: factory.publicKey("image"),
          file_id: factory.uuid("image")
        }
      };

      const result = await request(options);

      expect(typeof result.headers).toBe("object");
      expect(result.url).toBe(`${settings.baseURL}/info/`);
      expect(typeof result.data).toBe("object");
      expect(result.data.uuid).toBe(factory.uuid("image"));
    });

    it("on valid POST request", async () => {
      const file = factory.image("blackSquare");
      const options = {
        method: "POST",
        path: "/base/",
        body: {
          UPLOADCARE_PUB_KEY: factory.publicKey("demo"),
          file: file.data
        }
      };
      const result = await request(options);

      expect(typeof result.headers).toBe("object");
      expect(result.url).toBe(`https://upload.uploadcare.com/base/`);
      expect(typeof result.data).toBe("object");
      expect(typeof result.data.file).toBe("string");
    });
  });

  describe("should be rejected", () => {
    it("if Uploadcare returns error", async () => {
      const options = {
        baseURL: settings.baseURL,
        path: "/info/",
        query: { pub_key: factory.publicKey("image") }
      };

      await expectAsync(request(options)).toBeRejectedWithError(
        UploadcareError
      );
    });
  });
});

// it('if promise canceled', async () => {
//   const options = {
//     baseURL: settings.baseURL,
//     path: '/info/',
//     query: {
//       pub_key: factory.publicKey('image'),
//       file_id: factory.uuid('image'),
//     },
//   }
//   const upload = request(options)

//   await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)
// })
