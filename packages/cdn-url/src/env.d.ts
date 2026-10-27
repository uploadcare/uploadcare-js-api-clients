/**
 * Compile-time flag: `true` in the development bundle (eager validation,
 * runtime checks, descriptive errors), `false` in the production bundle
 * (checks are stripped by dead code elimination).
 */
declare const __DEV__: boolean
