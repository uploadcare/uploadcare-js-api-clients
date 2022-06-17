import { getAcceptHeader } from './getAcceptHeader'
import { AuthSchema, AuthSchemaOptions } from './types'
import { Headers } from '../lib/fetch/fetch.node'

export type UploadcareSimpleAuthSchemaOptions = AuthSchemaOptions & {
  secretKey: string
}

export class UploadcareSimpleAuthSchema implements AuthSchema {
  private publicKey: string
  private secretKey: string

  constructor({ publicKey, secretKey }: UploadcareSimpleAuthSchemaOptions) {
    this.publicKey = publicKey
    this.secretKey = secretKey
  }

  async getHeaders(): Promise<Headers> {
    return new Headers({
      Accept: getAcceptHeader(),
      Authorization: `Uploadcare.Simple ${this.publicKey}:${this.secretKey}`
    })
  }
}
