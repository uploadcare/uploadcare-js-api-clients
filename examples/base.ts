import { createReadStream } from "fs";
import base from "../src/api/base";

base(createReadStream("/Users/jeetiss/Projects/uploadcare-upload-client/camphoto.jpeg"), {
  publicKey: "e817444de392775585a3", // 3
  fileName: "image.png",
  onProgress: console.log
})
  .then(console.log)
  .catch(console.log);
