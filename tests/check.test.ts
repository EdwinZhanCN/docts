import { expect, test } from "vite-plus/test";
import { join } from "node:path";
import { checkDocFile } from "../src/check.ts";

const root = join(import.meta.dirname, "..");

test("a doc.ts whose links are all imported passes", () => {
  const violations = checkDocFile(join(root, "examples/counter/doc.ts"));
  expect(violations).toEqual([]);
});

test("a {@link} with no backing import is flagged (tsc cannot see this)", () => {
  const violations = checkDocFile(join(root, "tests/fixtures/bad/doc.ts"));
  expect(violations).toHaveLength(1);
  expect(violations[0].link.symbol).toBe("Ghost");
});
