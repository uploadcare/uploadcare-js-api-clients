# Validate user input

Sometimes transformation chains come from outside: an API that accepts `cdnUrlModifiers`, an admin panel where marketers compose effects, rows written by an older system. The development bundle's eager checks don't run in production, so for untrusted chains you have to validate explicitly.

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

Note what parsing does not do: `parseOperations` accepts any well-formed chain and never re-runs the creators' value checks, so an out-of-range scalar like `blur/99999` parses fine and is only caught by the CDN. Validation below checks chain _structure_; for value-level safety, prefer building operations yourself from typed parameters (see [Defense in depth](#defense-in-depth)).

`validateOperations` never throws; it returns findings you decide about. Each diagnostic carries a `severity`, a stable `code`, a human-readable `message`, and the offending `opIndex` where applicable.

## What it catches

| Code                            | Severity | Meaning                                                                                                                  |
| ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `must-be-last`                  | error    | `main_colors` / `json` / video `thumbs~N` not at the end of the chain                                                    |
| `dimensions-exceed-limit`       | error    | output above 3000px (5000px with `format/jpeg`)                                                                          |
| `video-size-not-divisible-by-4` | error    | invalid video `size` dimension                                                                                           |
| `no-core-operation`             | warning  | processing ops present but no `preview`/`resize`/`smart_resize`/`scale_crop`, so the CDN delivers the original untouched |
| `duplicate-operation`           | warning  | same non-repeatable op twice; the CDN applies the last one                                                               |
| `stretch-without-resize`        | warning  | `stretch` with no following resize, so it does nothing                                                                   |
| `modifier-without-target`       | warning  | `font` / `text_align` / `text_box` with no following `text`, so it does nothing                                          |
| `unknown-operation`             | info     | op the library doesn't know; passed through as-is                                                                        |

Video chains use their own rule set:

```ts
validateOperations(operations, { conversion: 'video' })
```

## Stackable operations

Some operations are meant to repeat: you can layer several `overlay`s or `text`s. For everything else the CDN keeps only the last occurrence, which is what `duplicate-operation` warns about.

The rules the validator is built on are exported, so you can reason about a single operation without running the whole validator:

```ts
import {
  isStackable,
  isCoreOperation,
  mustBeLast,
  STACKABLE_OPERATIONS,
  CORE_OPERATIONS,
  MUST_BE_LAST_OPERATIONS
} from '@uploadcare/cdn-url/validate'

isStackable(overlay) // → true, layering is meaningful
isStackable(quality) // → false, a second one just wins
isCoreOperation(resize) // → true, unlocks the CDN's processing defaults
mustBeLast(thumbs(5)) // → true, counted suffix handled
```

The predicates take any operation ref (name, operation object, or creator) and resolve aliases and counted suffixes; the raw `ReadonlySet`s are there when you need to enumerate rather than ask.

This is what tells you which override to reach for: `isStackable(op)` false means `url.replace(op)` is right, true means you probably want `url.replaceAll(op)` or a deliberate `with()` to add another layer.

## Order-dependent operations

A CDN chain is flat, and nothing nests. But a few operations are _state_ for a later one: `font`, `text_align` and `text_box` configure the `text` that follows them, and `stretch` configures the following `resize`/`scale_crop`. Move one across its target and it silently stops applying.

`operationInputs` and `operationDependents` make those edges queryable in both directions. They take an operation ref (a name, a creator, or an operation object), exactly like `has`/`get`/`getAll`:

```ts
import {
  operationInputs,
  operationDependents
} from '@uploadcare/cdn-url/validate'

const ops = parseOperations(userInput)

operationInputs(ops, 'text') // what configures the text
operationDependents(ops, font) // what this font affects
```

A name or creator resolves to the first match, like `CdnUrl.get`. To pin one occurrence out of several, pass the element itself; identity wins over name matching:

```ts
const [, second] = url.getAll(text)
operationInputs(url.operations, second) // the modifiers reaching that text
```

Each edge reports the related operation, its `index`, a `reason`, and a `kind`:

- `modifier` is positional state. The nearest preceding one wins, so a second `font` overrides the first for everything after it.
- `ceiling` is a chain-wide limit rather than a position: `format/jpeg` raises the output dimension cap from 3000px to 5000px for every core operation, wherever it sits.

```ts
const chain = [
  font(24),
  textAlign('center', 'bottom'),
  text(['80p', '20p'], 'bottom', 'Hi')
]
operationInputs(chain, 'text').map((d) => d.operation.name) // → ['font', 'text_align']
operationDependents(chain, 'font').map((d) => d.index) // → [2]
```

### Walking the whole chain

When you want every relationship at once, say for a UI or a normalizer, skip the per-operation lookups and take the graph. One node per operation, in order, with both edge lists already resolved:

```ts
import {
  operationGraph,
  isOperationModifier
} from '@uploadcare/cdn-url/validate'

// every modifier that never reaches a target
const orphans = operationGraph(ops).filter(
  (node) => isOperationModifier(node.operation) && node.dependents.length === 0
)
```

The graph addresses operations by position, so it stays unambiguous even when the same operation object appears twice in a chain.

An empty `dependents` list for a modifier means it does nothing, which is precisely what the `stretch-without-resize` and `modifier-without-target` diagnostics report. The validator runs on this same graph, so the two cannot disagree.

`OPERATION_MODIFIERS` exposes the table (target → the operations that configure it), and `isOperationModifier(ref)` answers the single-operation question.

::: warning Deliberately incomplete
Only relationships the library can source are modelled: the text-overlay state operations, the `stretch` rule, and the `format/jpeg` ceiling. Overlay z-order, `blur_region` versus `blur`, and other interactions are not represented. The CDN engine's exact rules are not public, and guessing would be worse than an honest gap. Treat a missing edge as "not modelled", not "no relationship".
:::

## Policy is yours

The library reports; you decide. Sensible defaults for an API boundary:

- errors → reject the request
- warnings → accept, log, and alert on volume; they produce _working_ URLs, just wasteful or surprising ones
- `unknown-operation` → your call. Rejecting unknowns is safer for a public API; allowing them keeps forward compatibility with new CDN features. Check `d.code === 'unknown-operation'` and apply your policy.

## Defense in depth

Validation checks chain _structure_. It doesn't make a malicious-but-valid chain cheap. For public-facing parameters, also constrain what you accept at the type level: take `{ width: number }` from the user and build the operations yourself with creators, rather than accepting raw modifier strings where possible.
