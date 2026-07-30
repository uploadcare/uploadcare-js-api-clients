# Dev & production bundles

The package ships two bundle flavors from one source, selected automatically through the `development` / `production` [export conditions](https://nodejs.org/api/packages.html#community-conditions-definitions).

## What each flavor does

|                                                   | development                         | production (default) |
| ------------------------------------------------- | ----------------------------------- | -------------------- |
| Operation creators validate ranges/enums          | ✅ throw `TypeError` / `RangeError` | ❌ stripped          |
| Builder misuse guards (ops on a group root)       | ✅ throw                            | silently no-op       |
| `videoPath` / `nthUrl` input checks               | ✅ throw                            | ❌ stripped          |
| Structural errors (`parseCdnUrl`, `parseGroupId`) | ✅ throw                            | ✅ throw             |
| `validate` module                                 | ✅ fully functional                 | ✅ fully functional  |
| Minified                                          | no                                  | yes                  |

The contract is to catch mistakes in development; production is garbage in, garbage out. `quality('ultra')` throws on your machine and in CI; in a production build it serializes to `-/quality/ultra/` and the CDN responds with an error instead.

Structural errors stay in both flavors because callers rely on them for control flow. A `try/catch` around `parseCdnUrl` behaves identically everywhere.

## What each function does when it fails

Four failure modes exist, and which one you get is a property of the function, not of the bundle. This is the whole map:

| Failure mode                                                       | Functions                                                                                                                                                           | In production                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **Always throws** — structural, you cannot proceed                 | `parseCdnUrl` and the per-kind parsers, `parseGroupId`, `serializeCdnUrl`'s addressing guard, `cdn.base('')`, `cdn.file`/`group`/`gif2video` before a base is bound | throws                            |
| **Dev-only throw, then no-op** — misuse the facade catches for you | builder and chain guards: operations on a group root, a filename on a proxy                                                                                         | returns the receiver unchanged    |
| **Dev-only throw, then garbage in / garbage out** — value checks   | every operation creator (`quality('ultra')`, out-of-range sizes, bad enums), `videoPath`/`nthUrl` input checks                                                      | serializes the bad value as given |
| **Never throws, returns findings**                                 | `validateOperations` and the rest of the `validate` entry                                                                                                           | identical to development          |

Two functions sit outside the table because their behaviour depends on the runtime rather than the bundle: [`prefixedCdnBaseAsync`](/guide/cdn-base#sync-or-async) resolves in browsers and workers and **rejects under Node**, where the synchronous helper is native; `prefixedCdnBase` works everywhere.

The string level ([`tinyParse`/`tinyBuild`](/guide/string-level-api)) throws nowhere, in either flavor, by design — it does no validation at all.

## Who picks which bundle

- Vite, webpack and friends resolve the `development` condition in dev servers and `production` in production builds, with no configuration needed.
- Node uses the production bundle by default; opt into the checks with `node --conditions=development`.
- Unknown or legacy resolvers fall back to production, the safe minimal default.

## Validating at runtime anyway

Stripped checks protect _your_ code from _your_ mistakes. If operation chains come from users or stored data, validate them explicitly. [`validateOperations`](/how-to/validate-user-input) works identically in both flavors and returns diagnostics instead of throwing.
