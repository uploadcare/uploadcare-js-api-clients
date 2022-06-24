export interface AuthSchema {
  getHeaders(request: Request): Promise<Headers>
}

export interface AuthSchemaOptions {
  publicKey: string
}
