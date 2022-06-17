import { Headers } from '../lib/fetch/fetch.node'
import { getAcceptHeader } from './getAcceptHeader'
import { AuthSchema, AuthSchemaOptions } from './types'
import { Md5Function } from '../lib/md5/Md5Function'

type SignStringParams = {
  method: string
  contentHash: string
  contentType: string
  date: string
  uri: string
}

export type SignatureResolver = (signString: string) => Promise<string>

export type UploadcareAuthSchemaOptions = AuthSchemaOptions & {
  signatureResolver: SignatureResolver
  md5Loader?: () => Promise<Md5Function>
}

export class UploadcareAuthSchema implements AuthSchema {
  private _publicKey: string
  private _signatureResolver: SignatureResolver
  private _md5Loader: Promise<Md5Function>

  constructor({
    publicKey,
    signatureResolver,
    md5Loader
  }: UploadcareAuthSchemaOptions) {
    this._publicKey = publicKey
    this._signatureResolver = signatureResolver

    if (md5Loader) {
      this._md5Loader = md5Loader()
    } else {
      this._md5Loader = import('../lib/md5/md5.node').then((m) => m.md5)
    }
  }

  private async md5(input: string) {
    const md5 = await this._md5Loader
    return md5(input)
  }

  private getSignString(params: SignStringParams): string {
    return [
      params.method,
      params.contentHash,
      params.contentType,
      params.date,
      params.uri
    ].join('\n')
  }

  async getHeaders(request: Request): Promise<Headers> {
    const body = await request.text()
    const contentHash = await this.md5(body || '')

    const date = new Date().toUTCString()
    const url = new URL(request.url)
    const uri = url.pathname + url.search + url.hash
    const signString = this.getSignString({
      contentType: request.headers.get('Content-Type') || '',
      method: request.method,
      contentHash,
      date,
      uri
    })
    const signature = await this._signatureResolver(signString)
    const headers = new Headers({
      ...Object.fromEntries(request.headers.entries()),
      Date: date,
      Accept: getAcceptHeader(),
      Authorization: `Uploadcare ${this._publicKey}:${signature}`
    })
    return headers
  }
}
