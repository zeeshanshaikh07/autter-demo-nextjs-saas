import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";

type Lockfile = {
  packages: Record<string, { version?: string }>;
};

const lockfile = JSON.parse(
  readFileSync(resolve(process.cwd(), "package-lock.json"), "utf8"),
) as Lockfile;

function resolvedVersion(packageName: string): string {
  const entry = lockfile.packages[`node_modules/${packageName}`];
  if (!entry?.version) {
    throw new Error(`package-lock.json has no resolved version for ${packageName}`);
  }
  return entry.version;
}

function compareVersions(left: string, right: string): number {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

// Versions below these minimums are affected by the advisories tracked for
// this dependency update. Keep the lockfile pinned at or above them.
const patchedMinimums: Record<string, string> = {
  next: "15.5.28",
  postcss: "8.5.23",
  tinypool: "2.1.2",
  vite: "7.3.7",
  "source-map-js": "1.2.2",
  zod: "4.6.6",
};

test("locks vulnerable dependencies at or above their patched versions", () => {
  for (const [packageName, minimum] of Object.entries(patchedMinimums)) {
    const resolved = resolvedVersion(packageName);
    expect(
      compareVersions(resolved, minimum),
      `${packageName}@${resolved} must be >= ${minimum}`,
    ).toBeGreaterThanOrEqual(0);
  }
});