export type AuthSchema = {
  publicKey: string
  getHeaders(request: Request): Promise<Headers>
}

export type AuthSchemaOptions = {
  publicKey: string
}
