import type { DocModule, LinkRef } from "./parse.ts";

/**
 * Render a parsed `@module` comment to markdown for humans and agents.
 *
 * The author already wrote valid markdown, so this passes the comment through
 * verbatim — lists, tables, fenced code and all — and only rewrites the exact
 * source spans of real `{@link Symbol}` tags into links to the source file the
 * symbol is imported from (`[AuthProvider](./auth.ts)`). tsdoc is used solely to
 * locate those spans, so `` `{@link}` `` inside a code span is left untouched.
 */
export function renderMarkdown(mod: DocModule): string {
  if (!mod.commentText) return "";

  const splices = mod.links
    .filter((link) => link.isCodeLink && link.start >= 0)
    .sort((a, b) => a.start - b.start);

  let out = "";
  let cursor = 0;
  for (const link of splices) {
    out += mod.commentText.slice(cursor, link.start) + linkMarkdown(link, mod.imports);
    cursor = link.end;
  }
  out += mod.commentText.slice(cursor);

  return stripCommentSyntax(out);
}

/** A code link becomes a source-file link, or a code span when unbacked. */
function linkMarkdown(link: LinkRef, imports: Map<string, string>): string {
  const specifier = imports.get(link.symbol);
  return specifier ? `[${link.display}](${specifier})` : "`" + link.display + "`";
}

/** Strip the `/** *\/` delimiters, the ` * ` line margins, and tag lines. */
function stripCommentSyntax(block: string): string {
  const body = block.replace(/^\s*\/\*\*/, "").replace(/\*\/\s*$/, "");
  const lines = body
    .split("\n")
    .map((line) => line.replace(/^[ \t]*\*[ ]?/, ""))
    .filter((line) => !/^\s*@(module|packageDocumentation)\b/.test(line));
  return lines.join("\n").trim() + "\n";
}
