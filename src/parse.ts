import { readFileSync } from "node:fs";
import ts from "typescript";
import {
  TSDocParser,
  TSDocConfiguration,
  TSDocTagDefinition,
  TSDocTagSyntaxKind,
  TextRange,
  DocNodeKind,
} from "@microsoft/tsdoc";
import type {
  DocComment,
  DocNode,
  DocExcerpt,
  DocLinkTag,
  DocDeclarationReference,
} from "@microsoft/tsdoc";

/** A single `{@link …}` reference found inside the `@module` comment. */
export interface LinkRef {
  /** The symbol the link points at; empty for bare URL links. */
  symbol: string;
  /** The text to display — the link's own text, or the symbol when omitted. */
  display: string;
  /** Whether the link targets a code symbol (vs. a plain URL). */
  isCodeLink: boolean;
  /** Start offset of the whole `{@link …}` within `commentText`. */
  start: number;
  /** End offset of the whole `{@link …}` within `commentText`. */
  end: number;
}

/** The result of parsing one `doc.ts` file. */
export interface DocModule {
  /** Path the module was read from. */
  filePath: string;
  /** Local import name → module specifier, e.g. `AuthProvider` → `./auth.ts`. */
  imports: Map<string, string>;
  /** The raw `/** … *\/` block, used by the renderer for verbatim passthrough. */
  commentText: string;
  /** Absolute offset of `commentText` within the source — for reporting positions. */
  commentStart: number;
  /** Every `{@link …}` found in the comment, in source order. */
  links: LinkRef[];
  /** Whether an `@module` / `@packageDocumentation` comment was found. */
  hasModuleDoc: boolean;
}

// `@module` is a TypeDoc-ism, not standard TSDoc — register it so the parser
// treats it as a known modifier tag instead of flagging it.
const configuration = new TSDocConfiguration();
const moduleTag = new TSDocTagDefinition({
  tagName: "@module",
  syntaxKind: TSDocTagSyntaxKind.ModifierTag,
});
configuration.addTagDefinition(moduleTag);
configuration.setSupportForTag(moduleTag, true);
const parser = new TSDocParser(configuration);

/** Parse a `doc.ts` file into its imports, `@module` comment, and links. */
export function parseDocFile(filePath: string): DocModule {
  return parseDocText(readFileSync(filePath, "utf8"), filePath);
}

/**
 * Parse `doc.ts` source text directly.
 *
 * Used by the oxlint rule, which is handed already-loaded source rather than a
 * path. `parseDocFile` is the thin file-reading wrapper around this.
 */
export function parseDocText(text: string, filePath = "<text>"): DocModule {
  const source = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true);
  const imports = collectImports(source);
  const range = findModuleCommentRange(text);

  if (range === null) {
    return {
      filePath,
      imports,
      commentText: "",
      commentStart: 0,
      links: [],
      hasModuleDoc: false,
    };
  }

  const context = parser.parseRange(TextRange.fromStringRange(text, range.pos, range.end));
  const docComment = context.docComment;
  return {
    filePath,
    imports,
    commentText: text.slice(range.pos, range.end),
    commentStart: range.pos,
    links: extractLinks(docComment, range.pos),
    hasModuleDoc: docComment.modifierTagSet.hasTagName("@module"),
  };
}

/** Map each imported local name to the module specifier it came from. */
function collectImports(source: ts.SourceFile): Map<string, string> {
  const map = new Map<string, string>();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const specifier = statement.moduleSpecifier.text;
    const clause = statement.importClause;
    if (clause.name) map.set(clause.name.text, specifier);
    const bindings = clause.namedBindings;
    if (bindings) {
      if (ts.isNamespaceImport(bindings)) {
        map.set(bindings.name.text, specifier);
      } else {
        for (const element of bindings.elements) {
          map.set(element.name.text, specifier);
        }
      }
    }
  }
  return map;
}

/** Locate the `/** … *\/` block carrying `@module` / `@packageDocumentation`. */
function findModuleCommentRange(text: string): { pos: number; end: number } | null {
  for (const match of text.matchAll(/\/\*\*[\s\S]*?\*\//g)) {
    if (/@module\b|@packageDocumentation\b/.test(match[0])) {
      return { pos: match.index, end: match.index + match[0].length };
    }
  }
  return null;
}

/**
 * Collect every `{@link …}` with its source span, relative to `commentText`.
 *
 * `base` is the comment's absolute start, used to rebase tsdoc's file-absolute
 * excerpt offsets onto `commentText`. Links inside code spans are never visited,
 * so the renderer leaves `` `{@link}` `` alone for free.
 */
function extractLinks(doc: DocComment, base: number): LinkRef[] {
  const out: LinkRef[] = [];
  const visit = (node: DocNode): void => {
    if (node.kind === DocNodeKind.LinkTag) {
      const tag = node as DocLinkTag;
      const span = nodeSpan(tag);
      const symbol = linkTargetSymbol(tag);
      out.push({
        symbol,
        display: tag.linkText?.trim() || symbol,
        isCodeLink: tag.codeDestination !== undefined,
        start: span ? span.start - base : -1,
        end: span ? span.end - base : -1,
      });
    }
    for (const child of node.getChildNodes()) visit(child);
  };
  visit(doc.summarySection);
  return out;
}

/** Min/max file-absolute offsets across a node's excerpt tokens. */
function nodeSpan(node: DocNode): { start: number; end: number } | null {
  let start = Infinity;
  let end = -Infinity;
  const visit = (n: DocNode): void => {
    if (n.kind === DocNodeKind.Excerpt) {
      const range = (n as DocExcerpt).content.getContainingTextRange();
      if (range.pos < start) start = range.pos;
      if (range.end > end) end = range.end;
    }
    for (const child of n.getChildNodes()) visit(child);
  };
  visit(node);
  return end >= start ? { start, end } : null;
}

/** Pull the trailing identifier out of a link's code destination. */
function linkTargetSymbol(tag: DocLinkTag): string {
  const dest: DocDeclarationReference | undefined = tag.codeDestination;
  if (!dest) return "";
  const refs = dest.memberReferences;
  if (refs.length > 0) {
    return refs[refs.length - 1].memberIdentifier?.identifier ?? "";
  }
  return dest.packageName ?? "";
}
