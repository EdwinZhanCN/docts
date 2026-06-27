# docts

Architecture docs in `doc.ts` that fail the build when they drift — the
TypeScript answer to Go's `doc.go`.

Write package-level prose in a `doc.ts` file, inside a `/** … @module */`
comment, and reference real code symbols with `{@link Symbol}`. Two guarantees
keep that prose honest:

- **tsc** — every referenced symbol is `import type`-d, so renaming or deleting
  it fails the type check.
- **docts** — every `{@link X}` must be backed by an `import` of `X`, the half
  tsc can't see, so no reference slips through unchecked.

```ts
// features/counter/doc.ts
/**
 * # Counter
 *
 * {@link Counter} owns the value; {@link createCounter} hands out fresh ones.
 *
 * @module
 */
import type { Counter, createCounter } from "./counter.ts";

export {};
```

## Install

Within the same repo, link it as a dev dependency:

```jsonc
// package.json
"devDependencies": {
  "docts": "link:../3rd-party/docts"
}
```

Once it lives in its own repo, swap the link for a git dependency
(`"docts": "github:EdwinZhanCN/docts"`).

The package ships three entry points: the core library (`docts`), an oxlint
plugin (`docts/oxlint`), and a vite plugin (`docts/vite`).

## Checking — `docts/oxlint`

Register the plugin in your lint config and turn the rule on:

```ts
// vite.config.ts
lint: {
  jsPlugins: ["docts/oxlint"],
  rules: { "docts/link-needs-import": "error" },
  // doc.ts imports are documentation-only: tsc counts a {@link} as a use, the
  // linter's no-unused-vars does not, so hand that rule back to tsc on doc.ts.
  overrides: [
    {
      files: ["**/doc.ts"],
      rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": "off",
      },
    },
  ],
}
```

A `{@link X}` with no backing `import` now fails the lint pass, pointing right
at the link.

## Rendering — `docts/vite`

```ts
// vite.config.ts
import { docts } from "docts/vite";

export default {
  plugins: [docts({ root: "src" })],
};
```

Each `doc.ts` renders to a sibling `doc.md`, committed alongside the source so
it reads in the editor and on GitHub. The prose passes through verbatim — lists,
tables, fenced code and all — and every `{@link Symbol}` becomes a link to the
source file the symbol is imported from (`[Counter](./counter.ts)`), parsed with
the standard [`@microsoft/tsdoc`](https://github.com/microsoft/tsdoc) grammar.
Pass `outFile` to change where the markdown lands.

## Development

```bash
vp install
vp test    # core, oxlint rule, and vite plugin
vp check   # fmt + lint + typecheck — docts lints its own doc.ts here
vp pack    # build dist/{index,oxlint,vite}.mjs
```
