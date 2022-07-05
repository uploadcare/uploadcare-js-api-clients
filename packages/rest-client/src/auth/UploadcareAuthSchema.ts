import { Headers } from '../lib/fetch/fetch.node'
import { getAcceptHeader } from '../tools/getAcceptHeader'
import { AuthSchema } from './types'
import { Md5Function } from '../lib/md5/Md5Function'
import { RestClientError } from '../tools/RestClientError'
import { isNode } from '@uploadcare/api-client-utils'

type SignStringParams = {
  method: string
  contentHash: string
  contentType: string
  date: string
  uri: string
}
export type UploadcareAuthSchemaSignatureResolver = (
  signString: string
) => Promise<string>

export type SignatureCreator = (
  secretKey: string,
  signString: string
) => Promise<string>

export type UploadcareAuthSchemaOptionsWithSignatureResolver = {
  publicKey: string
  signatureResolver: UploadcareAuthSchemaSignatureResolver
  md5Loader?: () => Promise<Md5Function>
}

export type UploadcareAuthSchemaOptionsWithSecretKey = {
  publicKey: string
  secretKey: string
  md5Loader?: () => Promise<Md5Function>
}

function hasSignatureResolver(
  options:
    | UploadcareAuthSchemaOptionsWithSignatureResolver
    | UploadcareAuthSchemaOptionsWithSecretKey
): options is UploadcareAuthSchemaOptionsWithSignatureResolver {
  return !!(options as UploadcareAuthSchemaOptionsWithSignatureResolver)
    .signatureResolver
}

function hasSecretKey(
  options:
    | UploadcareAuthSchemaOptionsWithSignatureResolver
    | UploadcareAuthSchemaOptionsWithSecretKey
): options is UploadcareAuthSchemaOptionsWithSecretKey {
  return !!(options as UploadcareAuthSchemaOptionsWithSecretKey).secretKey
}

export class UploadcareAuthSchema implements AuthSchema {
  private _publicKey: string
  private _signatureResolver: UploadcareAuthSchemaSignatureResolver
  private _md5Loader: Promise<Md5Function>

  constructor(
    options:
      | UploadcareAuthSchemaOptionsWithSignatureResolver
      | UploadcareAuthSchemaOptionsWithSecretKey
  ) {
    if (hasSecretKey(options)) {
      if (!isNode()) {
        console.warn(
          `Seems that you're using the secret key on the client-side. We're hope you know what you're doing.`
        )
      }
      this._signatureResolver = (signString: string) =>
        import('./createSignature.node').then((m) =>
          m.createSignature(options.secretKey, signString)
        )
    } else if (hasSignatureResolver(options)) {
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

  get publicKey() {
    return this._publicKey
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
      'X-Uploadcare-Date': date,
      Accept: getAcceptHeader(),
      Authorization: `Uploadcare ${this._publicKey}:${signature}`
    })
    return headers
  }
}
