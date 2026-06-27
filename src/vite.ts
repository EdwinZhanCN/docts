import { writeFile } from "node:fs/promises";
import { dirname, join, sep } from "node:path";
import type { Plugin } from "vite";
import { findDocFiles } from "./find.ts";
import { parseDocFile } from "./parse.ts";
import { renderMarkdown } from "./render.ts";

export interface DoctsViteOptions {
  /** Directory scanned for `doc.ts`. Default: `"src"`. */
  root?: string;
  /**
   * Map a `doc.ts` path to its output markdown path.
   * Default: a sibling `doc.md`.
   */
  outFile?: (docPath: string) => string;
}

/**
 * Vite plugin: render every `doc.ts` to markdown on build, and re-render on
 * change in dev. The render itself lives in the framework-agnostic core
 * (`renderMarkdown`); this is only the build-graph adapter, so the same output
 * is reachable from CI or a non-vite pipeline.
 */
export function docts(options: DoctsViteOptions = {}): Plugin {
  const root = options.root ?? "src";
  const outFile = options.outFile ?? ((docPath) => join(dirname(docPath), "doc.md"));

  async function renderAll(): Promise<void> {
    for (const file of await findDocFiles(root)) {
      await writeFile(outFile(file), renderMarkdown(parseDocFile(file)), "utf8");
    }
  }

  const isDocFile = (file: string): boolean => file.endsWith(`${sep}doc.ts`);

  return {
    name: "docts",
    async buildStart() {
      await renderAll();
    },
    configureServer(server) {
      server.watcher.on("change", (file) => {
        if (isDocFile(file)) void renderAll();
      });
    },
  };
}
