declare module 'form-data' {
  declare class FormData {
    constructor(): FormData;

    append(key: string, value: string | Blob | File | Buffer | Stream): void;
  }

  declare export default typeof FormData;
}
