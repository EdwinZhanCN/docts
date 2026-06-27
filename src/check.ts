import { parseDocFile, parseDocText } from "./parse.ts";
import type { DocModule, LinkRef } from "./parse.ts";

/** One link that escapes tsc's reach because nothing imports its symbol. */
export interface Violation {
  filePath: string;
  link: LinkRef;
  message: string;
}

/**
 * Approach (1): docts only fills the gap tsc cannot see.
 *
 * tsc already fails the build when an `import type` points at a symbol that no
 * longer exists. docts asserts the complementary half — that every `{@link X}`
 * in the `@module` comment is backed by an `import` of `X` — so no reference can
 * silently bypass tsc's checking. Symbol existence stays tsc's job; link backing
 * is ours.
 */
export function checkDocModule(mod: DocModule): Violation[] {
  const violations: Violation[] = [];
  for (const link of mod.links) {
    if (!link.isCodeLink) continue; // plain URL links have no symbol to back
    if (!mod.imports.has(link.symbol)) {
      violations.push({
        filePath: mod.filePath,
        link,
        message:
          `{@link ${link.symbol}} has no matching import of \`${link.symbol}\`. ` +
          `Add \`import type { ${link.symbol} } from "…"\` so tsc verifies it.`,
      });
    }
  }
  return violations;
}

/** Parse and check a single `doc.ts` file. */
export function checkDocFile(filePath: string): Violation[] {
  return checkDocModule(parseDocFile(filePath));
}

/** Parse and check `doc.ts` source text — the entry the oxlint rule calls. */
export function checkDocText(text: string, filePath?: string): Violation[] {
  return checkDocModule(parseDocText(text, filePath));
}
