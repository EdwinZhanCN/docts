import { definePlugin } from "@oxlint/plugins";
import { parseDocText } from "./parse.ts";
import { checkDocModule } from "./check.ts";

const DOC_FILE = /(?:^|[/\\])doc\.ts$/;

/**
 * Oxlint plugin: `docts/link-needs-import`.
 *
 * The lint-pass home of `checkDocModule` — every `{@link X}` in a `doc.ts`
 * `@module` comment must be backed by an `import` of `X`. Pure syntax, so it
 * does not need oxlint's (still unsupported) type-aware path; tsc keeps the
 * complementary guarantee that the imported symbol exists.
 */
export default definePlugin({
  meta: { name: "docts" },
  rules: {
    "link-needs-import": {
      meta: {
        type: "problem",
        docs: {
          description: "Require an import backing every {@link} in a doc.ts @module comment.",
        },
      },
      create(context) {
        if (!DOC_FILE.test(context.physicalFilename)) return {};
        return {
          Program() {
            const { sourceCode } = context;
            const mod = parseDocText(sourceCode.text, context.physicalFilename);
            for (const { link, message } of checkDocModule(mod)) {
              const start = link.start >= 0 ? mod.commentStart + link.start : mod.commentStart;
              const end = link.end >= 0 ? mod.commentStart + link.end : start + 1;
              context.report({
                message,
                loc: {
                  start: sourceCode.getLocFromIndex(start),
                  end: sourceCode.getLocFromIndex(end),
                },
              });
            }
          },
        };
      },
    },
  },
});
