import { expect, test } from "vite-plus/test";
import { join } from "node:path";
import { findDocFiles } from "../src/find.ts";

const root = join(import.meta.dirname, "..");

test("findDocFiles locates doc.ts files and skips ignored dirs", async () => {
  const files = await findDocFiles(join(root, "examples"));
  expect(files).toEqual([join(root, "examples/counter/doc.ts")]);
});
