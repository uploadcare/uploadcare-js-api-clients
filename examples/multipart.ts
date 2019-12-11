import multipart from "../src/multipart/multipart";
import { readFileSync } from "fs";
import { lookup } from 'mime-types';

let buffer = readFileSync(
  "/Users/jeetiss/Projects/uploadcare-upload-client/file.mov"
);

console.log(lookup('file.mov'))

multipart(buffer, { publicKey: "e817444de392775585a3", contentType: lookup('file.mov'), fileName: 'file.mov' })
  .then(console.log)
  .catch(console.log);
