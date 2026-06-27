/**
 * # docts
 *
 * `docts` turns `doc.ts` files into architecture documentation that fails the
 * build when it drifts. It is the TypeScript answer to Go's `doc.go`: prose that
 * lives beside the code and cannot quietly go stale.
 *
 * The pipeline is four steps. {@link findDocFiles} locates every `doc.ts`.
 * {@link parseDocFile} pulls the `@module` comment together with its imports and
 * `{@link}` targets. {@link checkDocModule} enforces the one rule tsc cannot
 * see — every link must be backed by an `import` — while tsc itself guarantees
 * the imported symbol still exists. {@link renderMarkdown} emits markdown for
 * humans and agents.
 *
 * This file documents itself with the very convention it ships: each symbol it
 * names is `import type`-d below, so renaming any of them turns the build red.
 *
 * @module
 */
import type { findDocFiles } from "./find.ts";
import type { parseDocFile } from "./parse.ts";
import type { checkDocModule } from "./check.ts";
import type { renderMarkdown } from "./render.ts";

export {};
