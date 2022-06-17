export interface AuthSchema {
  getHeaders(request: Request): Promise<Headers>
}

export type AuthSchemaOptions = {
  publicKey: string
}
