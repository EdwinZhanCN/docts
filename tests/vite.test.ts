import { expect, test } from "vite-plus/test";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { docts } from "../src/vite.ts";

const root = join(import.meta.dirname, "..");

test("the vite plugin renders doc.ts to markdown on buildStart", async () => {
  const out = join(tmpdir(), `docts-arch-${Date.now()}.md`);
  const plugin = docts({
    root: join(root, "examples"),
    outFile: () => out,
  });

  const hook = plugin.buildStart;
  if (typeof hook !== "function") throw new Error("buildStart is not a function");
  await hook.call({} as never, {} as never);

  const md = await readFile(out, "utf8");
  expect(md).toContain("# Counter");
  expect(md).toContain("[Counter](./counter.ts)");
  await rm(out, { force: true });
});
