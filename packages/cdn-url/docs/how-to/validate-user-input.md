# Validate user input

Sometimes transformation chains come from outside: an API that accepts `cdnUrlModifiers`, an admin panel where marketers compose effects, rows written by an older system. The development bundle's eager checks don't run in production — for untrusted chains, validate explicitly.

## The two-step

Parse the chain, then run diagnostics:

```ts
import { parseOperations } from '@uploadcare/cdn-url'
import { validateOperations } from '@uploadcare/cdn-url/validate'

const operations = parseOperations(userInput) // throws TypeError if not an op chain
const diagnostics = validateOperations(operations)

const errors = diagnostics.filter((d) => d.severity === 'error')
if (errors.length > 0) {
  throw new BadRequestError(errors.map((d) => d.message).join('; '))
}
```

Note what parsing does **not** do: `parseOperations` accepts any well-formed chain — it never re-runs the creators' value checks, so an out-of-range scalar like `blur/99999` parses fine and is only caught by the CDN. Validation below checks chain _structure_; for value-level safety, prefer building operations yourself from typed parameters (see [Defense in depth](#defense-in-depth)).

`validateOperations` never throws — it returns findings you decide about. Each diagnostic carries a `severity`, a stable `code`, a human-readable `message`, and the offending `opIndex` where applicable.

## What it catches

| Code                            | Severity | Meaning                                                                                                                |
| ------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `must-be-last`                  | error    | `main_colors` / `json` / video `thumbs~N` not at the end of the chain                                                  |
| `dimensions-exceed-limit`       | error    | output above 3000px (5000px with `format/jpeg`)                                                                        |
| `video-size-not-divisible-by-4` | error    | invalid video `size` dimension                                                                                         |
| `no-core-operation`             | warning  | processing ops present but no `preview`/`resize`/`smart_resize`/`scale_crop` — the CDN delivers the original untouched |
| `duplicate-operation`           | warning  | same non-repeatable op twice; the CDN applies the last one                                                             |
| `stretch-without-resize`        | warning  | `stretch` with no following resize — it does nothing                                                                   |
| `unknown-operation`             | info     | op the library doesn't know; passed through as-is                                                                      |

Video chains use their own rule set:

```ts
validateOperations(operations, { conversion: 'video' })
```

## Policy is yours

The library reports; you decide. Sensible defaults for an API boundary:

- **errors** → reject the request
- **warnings** → accept, log, alert on volume — they produce _working_ URLs, just wasteful or surprising ones
- **`unknown-operation`** → your call. Rejecting unknowns is safer for a public API; allowing them keeps forward compatibility with new CDN features. Check `d.code === 'unknown-operation'` and apply your policy.

## Defense in depth

Validation checks chain _structure_ — it doesn't make a malicious-but-valid chain cheap. For public-facing parameters, also constrain what you accept at the type level: take `{ width: number }` from the user and build the operations yourself with creators, rather than accepting raw modifier strings where possible.
