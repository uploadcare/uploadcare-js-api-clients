---
layout: home

hero:
  name: '@uploadcare/cdn-url'
  text: Uploadcare CDN URLs, typed.
  tagline: Build and parse CDN URLs for transformations, groups, proxy and conversion paths. Atomic and tree-shakeable.
  actions:
    - theme: brand
      text: Getting started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /reference/

features:
  - title: Round-trip parser
    details: Lenient parsing of any CDN URL flavor, including files, groups, nth elements, conversion results and proxified sources. Unknown operations survive serialization.
  - title: Typed operations
    details: ~45 operation creators with eager validation of ranges, enums and grammars, straight from the CDN docs.
  - title: Chain validation
    details: Cross-operation diagnostics for the core operation requirement, must-be-last rules, last-wins duplicates and dimension ceilings.
  - title: Tree-shakeable
    details: Eleven atomic entry points; import only what you use. The proxy entry is under half a kilobyte.
---
