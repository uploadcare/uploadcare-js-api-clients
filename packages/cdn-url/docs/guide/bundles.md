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

The contract: **catch mistakes in development; production is garbage-in, garbage-out.** `quality('ultra')` throws on your machine and in CI; in a production build it serializes to `-/quality/ultra/` and the CDN responds with an error instead.

Structural errors stay in both flavors because callers rely on them for control flow — a `try/catch` around `parseCdnUrl` behaves identically everywhere.

## Who picks which bundle

- **Vite, webpack, and friends** resolve the `development` condition in dev servers and `production` in production builds — no configuration needed.
- **Node** uses the production bundle by default; opt into checks with `node --conditions=development`.
- **Unknown/legacy resolvers** fall back to production — the safe, minimal default.

## Validating at runtime anyway

Stripped checks protect _your_ code from _your_ mistakes. If operation chains come from **users or stored data**, validate them explicitly — [`validateOperations`](/how-to/validate-user-input) works identically in both flavors and returns diagnostics instead of throwing.
