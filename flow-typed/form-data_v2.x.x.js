declare module 'form-data' {
  declare class FormData {
    constructor(): FormData;

    append(
      key: string,
      value: string | Blob | File | Buffer | ArrayBuffer | stream$Readable,
      filename?: string,
    ): void;

    getHeaders(): {[name: string]: string}
  }

  declare export default typeof FormData
}
