import { getAcceptHeader } from '../tools/getAcceptHeader'
import { AuthSchema, AuthSchemaOptions } from './types'
import { Headers } from '../lib/fetch/fetch.node'
import { isNode } from '@uploadcare/api-client-utils'

export type UploadcareSimpleAuthSchemaOptions = AuthSchemaOptions & {
  secretKey: string
}

export class UploadcareSimpleAuthSchema implements AuthSchema {
  private publicKey: string
  private secretKey: string

  constructor({ publicKey, secretKey }: UploadcareSimpleAuthSchemaOptions) {
    this.publicKey = publicKey
    this.secretKey = secretKey

    if (secretKey && !isNode()) {
      console.warn(
        `Seems that you're using the secret key on the client-side. We're hope you know that you're doing.`
      )
    }
  }

  async getHeaders(): Promise<Headers> {
    return new Headers({
      Accept: getAcceptHeader(),
      Authorization: `Uploadcare.Simple ${this.publicKey}:${this.secretKey}`
    })
  }
}
