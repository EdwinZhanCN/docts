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

Published to GitHub Packages. Point the scope at the GitHub registry — note that
GitHub Packages requires a token (`read:packages`) to install even public
packages:

```ini
# .npmrc
@edwinzhancn:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```jsonc
// package.json
"devDependencies": {
  "@edwinzhancn/docts": "^0.1.0"
}
```

The package ships three entry points: the core library (`@edwinzhancn/docts`), an
oxlint plugin (`@edwinzhancn/docts/oxlint`), and a vite plugin
(`@edwinzhancn/docts/vite`).

## Checking — `@edwinzhancn/docts/oxlint`

Register the plugin in your lint config and turn the rule on:

```ts
// vite.config.ts
lint: {
  jsPlugins: ["@edwinzhancn/docts/oxlint"],
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

## Rendering — `@edwinzhancn/docts/vite`

```ts
// vite.config.ts
import { docts } from "@edwinzhancn/docts/vite";

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
