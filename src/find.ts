import { readdir } from "node:fs/promises";
import { join } from "node:path";

const IGNORED = new Set(["node_modules", ".git", "dist", ".vite-hooks", ".zed"]);

/**
 * Recursively collect every `doc.ts` path under `root`.
 *
 * Directories in the ignore set (`node_modules`, `dist`, …) are skipped. The
 * result is sorted so output is deterministic across platforms.
 */
export async function findDocFiles(root: string): Promise<string[]> {
  const out: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED.has(entry.name)) await walk(full);
      } else if (entry.isFile() && entry.name === "doc.ts") {
        out.push(full);
      }
    }
  }

  await walk(root);
  return out.sort();
}
