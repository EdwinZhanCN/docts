/**
 * # Counter
 *
 * A tiny feature module that hands out integer counters. It also shows
 * **everything** `docts` can render: prose with _emphasis_ and `inline code`,
 * links into the source, lists, a table, and a fenced code block.
 *
 * ## Pieces
 *
 * - {@link Counter} — the mutable counter itself
 * - {@link createCounter} — a factory that returns a fresh one
 *
 * Each link above is backed by an `import type` below, so renaming `Counter`
 * fails the build before this doc can lie. Writing `{@link}` inside a code span
 * like this is left untouched.
 *
 * ## Operations
 *
 * | method        | effect                       |
 * | ------------- | ---------------------------- |
 * | `increment()` | adds one and returns the sum |
 *
 * ## Usage
 *
 * ```ts
 * const counter = createCounter();
 * counter.increment(); // 1
 * counter.increment(); // 2
 * ```
 *
 * @module
 */
import type { Counter, createCounter } from "./counter.ts";

export {};
