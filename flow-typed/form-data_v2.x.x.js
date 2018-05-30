declare module 'form-data' {
  declare class FormData {
    constructor(): FormData;

    append(key: string, value: string | Blob | File | Buffer): void;
  }

  declare export default typeof FormData;
}
