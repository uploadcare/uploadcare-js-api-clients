import nodeFetch, {
  Headers as NodeHeaders,
  Request as NodeRequest,
  Response as NodeResponse
} from 'node-fetch'

export const fetch = nodeFetch as unknown as typeof window.fetch
export const Headers = NodeHeaders as unknown as typeof window.Headers
export const Request = NodeRequest as unknown as typeof window.Request
export const Response = NodeResponse as unknown as typeof window.Response
