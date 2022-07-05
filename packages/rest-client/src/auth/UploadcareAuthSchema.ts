import { Headers } from '../lib/fetch/fetch.node'
import { getAcceptHeader } from '../tools/getAcceptHeader'
import { AuthSchema, AuthSchemaOptions } from './types'
import { Md5Function } from '../lib/md5/Md5Function'
import { isNode } from '../tools/isNode'
import { RestClientError } from '../tools/RestClientError'

type SignStringParams = {
  method: string
  contentHash: string
  contentType: string
  date: string
  uri: string
}

export type SignatureResolver = (signString: string) => Promise<string>

export type SignatureCreator = (
  secretKey: string,
  signString: string
) => Promise<string>

export interface OptionsWithSignatureResolver extends AuthSchemaOptions {
  signatureResolver: SignatureResolver
  md5Loader?: () => Promise<Md5Function>
}

export interface OptionsWithSecretKey extends AuthSchemaOptions {
  secretKey: string
  md5Loader?: () => Promise<Md5Function>
}

function withSignatureResolver(
  options: OptionsWithSignatureResolver | OptionsWithSecretKey
): options is OptionsWithSignatureResolver {
  return !!(options as OptionsWithSignatureResolver).signatureResolver
}

function withSecretKey(
  options: OptionsWithSignatureResolver | OptionsWithSecretKey
): options is OptionsWithSecretKey {
  return !!(options as OptionsWithSecretKey).secretKey
}

export class UploadcareAuthSchema implements AuthSchema {
  private _publicKey: string
  private _signatureResolver: SignatureResolver
  private _md5Loader: Promise<Md5Function>

  constructor(options: OptionsWithSignatureResolver | OptionsWithSecretKey) {
    if (withSecretKey(options)) {
      if (!isNode()) {
        console.warn(
          `Seems that you're using the secret key on the client-side. We're hope you know that you're doing.`
        )
      }
      this._signatureResolver = (signString: string) =>
        import('./createSignature.node').then((m) =>
          m.createSignature(options.secretKey, signString)
        )
    } else if (withSignatureResolver(options)) {
      this._signatureResolver = options.signatureResolver
    } else {
      throw new RestClientError(
        `Please, provide either 'secretKey' or 'signatureResolver'`
      )
    }

    const { publicKey, md5Loader } = options
    this._publicKey = publicKey

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
