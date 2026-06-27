import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  pack: {
    entry: ["src/index.ts", "src/oxlint.ts", "src/vite.ts"],
    dts: {
      tsgo: true,
    },
    exports: true,
  },
  lint: {
    // Dogfood: docts lints its own doc.ts via its oxlint plugin during vp check.
    jsPlugins: ["./dist/oxlint.mjs"],
    rules: {
      "docts/link-needs-import": "error",
    },
    // The intentionally-broken fixture stays a unit-test input, not a lint target.
    ignorePatterns: ["tests/fixtures/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    overrides: [
      {
        // In a `doc.ts`, imports exist purely to back `{@link}` references —
        // tsc counts them as used, but the linter's no-unused-vars does not.
        // This is the documentation-only contract of the convention, not a hack.
        files: ["**/doc.ts"],
        rules: {
          "no-unused-vars": "off",
          "@typescript-eslint/no-unused-vars": "off",
        },
      },
    ],
  },
  fmt: {},
});
