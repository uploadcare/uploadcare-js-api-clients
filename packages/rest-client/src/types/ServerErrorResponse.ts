/** How most endpoints report a failure: one human-readable sentence. */
export type ServerErrorResponse = {
  detail: string
}

/**
 * Validation errors keyed by the field they belong to, as `POST /files/search/`
 * returns for a 400. There is no `detail` in this shape.
 */
export type ServerValidationErrorResponse = Record<string, string[]>
