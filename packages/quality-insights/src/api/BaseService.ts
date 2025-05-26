import { deepCamelKeysToSnake } from '../utils/deepCamelKeysToSnake'
import { Err, Ok, Result } from '../shared/lib/Result'

const BASE_URL = import.meta.env.VITE_BASE_URL

export class BaseAPIService {
  constructor(private baseUrl: string = BASE_URL) {}

  private async base<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Result<T, Error>> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        return Err(
          new Error(
            `Got non-200 response from "${url}". Status: ${response.status.toString()}`
          )
        )
      }

      try {
        const json = await response.json()
        return Ok(json as T)
      } catch (error: unknown) {
        return Err(
          new Error(`Error parsing JSON from "${url}". Error: ${error}`)
        )
      }
    } catch (error: unknown) {
      return Err(
        new Error(`Error fetching data from "${url}". Error: ${error}`)
      )
    }
  }

  protected async post<T, U extends object>(
    endpoint: string,
    body: U,
    options: RequestInit = {}
  ): Promise<Result<T, Error>> {
    return await this.base<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(deepCamelKeysToSnake(body)),
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    })
  }

  protected async get<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Result<T, Error>> {
    return await this.base<T>(endpoint, {
      method: 'GET',
      ...options
    })
  }
}
