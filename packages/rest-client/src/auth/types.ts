export type AuthSchema = {
  publicKey: string
  getHeaders(request: Request): Promise<Headers>
}
