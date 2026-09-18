/**
 * Build the request headers a token authenticates with.
 *
 * Returns an empty object for an absent token, so it can be spread
 * unconditionally into a request that may or may not be authenticated.
 *
 * @example
 *   fetch(url, { headers: { ...getAuthHeaders(await tokens.getToken()) } })
 */
export const getAuthHeaders = (
  token: string | undefined
): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {})
