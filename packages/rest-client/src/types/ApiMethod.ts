export type ApiMethod<
  Options extends Record<string, unknown>,
  Settings extends Record<string, unknown>,
  Response
> = (options: Options, settings: Settings) => Promise<Response>
