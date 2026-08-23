import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";

Deno.test("deno.json is valid and configures lint", () => {
  const raw = Deno.readTextFileSync("deno.json");
  const cfg = JSON.parse(raw);
  assert.ok(Array.isArray(cfg.lint?.exclude), "lint.exclude must be an array");
  assert.ok(
    cfg.lint.exclude.includes("node_modules"),
    "node_modules must be excluded from lint",
  );
});

Deno.test("package.json defines build script", () => {
  const pkg = JSON.parse(Deno.readTextFileSync("package.json"));
  assert.ok(typeof pkg.scripts?.build === "string");
});

Deno.test("supabase migrations exist with version-prefixed names", async () => {
  const dir = "supabase/migrations";
  assert.ok(existsSync(dir), `${dir} directory missing`);
  const files: string[] = [];
  for await (const f of Deno.readDir(dir)) {
    if (f.isFile && f.name.endsWith(".sql")) files.push(f.name);
  }
  assert.ok(files.length > 0, "no migration files found");
  for (const name of files) {
    assert.match(name, /^\d+_/, `migration ${name} must start with a version prefix`);
  }
});
