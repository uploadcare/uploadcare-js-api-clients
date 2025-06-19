export type Result<T, E = unknown> =
  | {
      ok: true
      value: T
    }
  | {
      ok: false
      error: E
    }

export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}
