import { getAcceptHeader } from '../tools/getAcceptHeader'
import { AuthSchema } from './types'
import { Headers } from '../lib/fetch/fetch.node'
import { isNode } from '@uploadcare/api-client-utils'

export type UploadcareSimpleAuthSchemaOptions = {
  publicKey: string
  secretKey: string
}

export class UploadcareSimpleAuthSchema implements AuthSchema {
  private _publicKey: string
  private _secretKey: string

  constructor({ publicKey, secretKey }: UploadcareSimpleAuthSchemaOptions) {
    this._publicKey = publicKey
    this._secretKey = secretKey

    if (secretKey && !isNode()) {
      console.warn(
        `Seems that you're using the secret key on the client-side. We're hope you know that you're doing.`
      )
    }
  }

  get publicKey() {
    return this._publicKey
  }

  async getHeaders(request: Request): Promise<Headers> {
    return new Headers({
      ...Object.fromEntries(request.headers.entries()),
      Accept: getAcceptHeader(),
      Authorization: `Uploadcare.Simple ${this._publicKey}:${this._secretKey}`
    })
  }
}
